// SPDX-License-Identifier: MIT LICENSE

pragma solidity ^0.8.0;

import "Doge.sol";

contract Memeverse is Ownable, IERC721Receiver, Pausable {
    // Maximum alpha score for a Chad
    uint8 public constant MAX_ALPHA = 8;

    // Struct to store a stake's token, earning values, owner
    struct Stake {
        uint16 tokenId;
        uint80 value;
        address owner;
    }

    event TokenStaked(address owner, uint256 tokenId, uint256 value);
    event VirginsClaimed(uint256 tokenId, uint256 earned, bool unstaked);
    event ChadsClaimed(uint256 tokenId, uint256 earned, bool unstaked);

    Doge doge; // Reference to the Doge NFT contract
    MEME meme; // Reference to the $MEME contract

    mapping(uint256 => Stake) public memeverse;    // tokenId => stake
    mapping(uint256 => Stake[]) public gym;        // alpha => all Chad stakes with that alpha
    mapping(uint256 => uint256) public gymIndices; // Chad => location of Chad in Gym

    uint256 public totalAlphaStaked = 0;
    uint256 public unaccountedRewards = 0; // rewards distributed when no Chads are staked
    uint256 public memePerAlpha = 0;       // amount of $MEME due for each alpha point staked

    uint256 public constant DAILY_MEME_RATE = 10000 ether; // Virgins earn 10000 $MEME per day
    uint256 public constant MINIMUM_TO_EXIT = 2 days;      // Virgins must have 2 days worth of $MEME to unstake
    uint256 public constant MEME_CLAIM_TAX_PERCENTAGE = 20; // Chads take a 20% tax on all $WOOL claimed
    uint256 public constant MAXIMUM_GLOBAL_MEME = 2400000000 ether; // only ever ~2.4b $MEME earned via staking

    uint256 public totalMemeEarned;
    uint256 public totalVirginsStaked;
    uint256 public lastClaimTimestamp; // the last time $MEME was claimed

    // Emergency rescue to allow unstaking without any checks but without $MEME
    bool public rescueEnabled = false;

    /**
     * @param _doge: reference to the Doge NFT contract
     * @param _meme: reference to the $MEME token
     */
    constructor(address _doge, address _meme) {
        doge = Doge(_doge);
        meme = MEME(_meme);
    }

    /** STAKING */

    /**
     * adds Virgins to the Memeverse and Chads to the gym
     * @param account: the address of the staker
     * @param tokenIds: the IDs of the Virgins and Chads to stake
     */
    function addManyToMemeverseAndGym(address account, uint16[] calldata tokenIds) external {
        require(
            account == _msgSender() || _msgSender() == address(doge),
            "Keep your tokens."
        );
        require(tx.origin == _msgSender());

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(doge.totalSupply() >= tokenIds[i] + doge.MAX_PER_MINT()); // ensure not in buffer
            if (_msgSender() != address(doge)) {
                // Skip this step if mint + stake
                require(
                    doge.ownerOf(tokenIds[i]) == _msgSender(),
                    "This is not your token!"
                );
                doge.transferFrom(_msgSender(), address(this), tokenIds[i]);
            } else if (tokenIds[i] == 0) {
                continue; // There may be gaps in the array for stolen tokens
            }
            if (isVirgin(tokenIds[i])) _addVirginToMemeverse(account, tokenIds[i]);
            else _addChadToGym(account, tokenIds[i]);
        }
    }

    // ** INTERNAL * //

    /**
     * Adds a single Virgin to the Memeverse
     * @param account: the address of the staker
     * @param tokenId: the ID of the Virgin to add to the Memeverse
     */
    function _addVirginToMemeverse(address account, uint256 tokenId) internal whenNotPaused _updateEarnings{
        memeverse[tokenId] = Stake({
            owner: account,
            tokenId: uint16(tokenId),
            value: uint80(block.timestamp)
        });
        totalVirginsStaked += 1;
        emit TokenStaked(account, tokenId, block.timestamp);
    }

    /**
     * adds a single Chad to the Gym
     * @param account the address of the staker
     * @param tokenId the ID of the Chad to add to the gym
     */
    function _addChadToGym(address account, uint256 tokenId) internal {
        uint256 alpha = _alphaForChad(tokenId);
        totalAlphaStaked += alpha; // Portion of earnings ranges from 8 to 5
        gymIndices[tokenId] = gym[alpha].length; // Store location of the Chad in the gym
        gym[alpha].push(
            Stake({
                owner: account,
                tokenId: uint16(tokenId),
                value: uint80(memePerAlpha)
            })
        );
        emit TokenStaked(account, tokenId, memePerAlpha);
    }

    /** CLAIMING / UNSTAKING */

    /**
     * Claim $MEME earnings and optionally unstake tokens from the Memeverse/gym.
     * Virgin must have 2 days worth of unclaimed $MEME to be unstaked.
     * @param tokenIds: the IDs of the tokens to claim earnings from
     * @param unstake: if should unstake all of the tokens listed in tokenIds
     */
    function claimManyFromMemeverseAndGym(uint16[] calldata tokenIds, bool unstake)
        external
        whenNotPaused
        _updateEarnings
    {
        require(tx.origin == _msgSender());
        uint256 owed = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (isVirgin(tokenIds[i]))
                owed += _claimVirginFromMemeverse(tokenIds[i], unstake);
            else owed += _claimChadFromGym(tokenIds[i], unstake);
        }
        if (owed == 0) return;
        meme.mint(_msgSender(), owed);
    }

    // ** INTERNAL * //

    /**
     * Claim $MEME earnings for a single Virgin and optionally unstake it.
     * If not unstaking, pay 20% tax to the staked Chads.
     * If unstaking, there is a 50% chance all $MEME is stolen.
     * @param tokenId: the ID of the Virgin to claim earnings from
     * @param unstake: whether or not to unstake the Virgin
     * owed: the amount of $MEME claimed
     */
    function _claimVirginFromMemeverse(uint256 tokenId, bool unstake) internal returns (uint256 owed) {
        Stake memory stake = memeverse[tokenId];

        require(stake.owner == _msgSender(), "Not yours to take!");
        require(
            !(unstake && block.timestamp - stake.value < MINIMUM_TO_EXIT),
            "You have not met the minimum to exit."
        );

        if (totalMemeEarned < MAXIMUM_GLOBAL_MEME) {
            owed = ((block.timestamp - stake.value) * DAILY_MEME_RATE) / 1 days;
        } else if (stake.value > lastClaimTimestamp) {
            owed = 0; // $MEME production stopped already
        } else {
            owed =
                ((lastClaimTimestamp - stake.value) * DAILY_MEME_RATE) /
                1 days; // stop earning additional $MEME if it's all been earned
        }

        if (unstake) {
            if (random(tokenId) & 1 == 1) {
                // 50% chance of all $MEME stolen
                _payChadTax(owed);
                owed = 0;
            }

            totalVirginsStaked -= 1;
            doge.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // send back Virgins
            delete memeverse[tokenId];
        } else {
            _payChadTax((owed * MEME_CLAIM_TAX_PERCENTAGE) / 100); // percentage tax to staked Chads
            owed = (owed * (100 - MEME_CLAIM_TAX_PERCENTAGE)) / 100; // remainder goes to Virgin owner

            memeverse[tokenId] = Stake({
                owner: _msgSender(),
                tokenId: uint16(tokenId),
                value: uint80(block.timestamp)
            }); // reset stake
        }

        emit VirginsClaimed(tokenId, owed, unstake);
    }

    /**
     * Claim $MEME earnings for a single Chad and optionally unstake it.
     * Chads earn $MEME proportional to their alpha rank.
     * @param tokenId: the ID of the Chad to claim earnings from
     * @param unstake: whether or not to unstake the Chad
     * owed: the amount of $MEME claimed
     */
    function _claimChadFromGym(uint256 tokenId, bool unstake) internal returns (uint256 owed) {
        require(doge.ownerOf(tokenId) == address(this), "Chad isn't in the gym."
        );

        uint256 alpha = _alphaForChad(tokenId);
        Stake memory stake = gym[alpha][gymIndices[tokenId]];
        require(stake.owner == _msgSender(), "Not yours to take!");
        owed = (alpha) * (memePerAlpha - stake.value); // calculate portion of tokens based on Alpha
        if (unstake) {
            totalAlphaStaked -= alpha; // remove alpha from total staked

            Stake memory lastStake = gym[alpha][gym[alpha].length - 1];
            gym[alpha][gymIndices[tokenId]] = lastStake; // shuffle last Chad to current position
            gymIndices[lastStake.tokenId] = gymIndices[tokenId];
            gym[alpha].pop(); // remove duplicate
            delete gymIndices[tokenId]; // delete previous mapping

            doge.safeTransferFrom(address(this), _msgSender(), tokenId, ""); // Send back Chad
        } else {
            gym[alpha][gymIndices[tokenId]] = Stake({
                owner: _msgSender(),
                tokenId: uint16(tokenId),
                value: uint80(memePerAlpha)
            }); // reset stake
        }

        emit ChadsClaimed(tokenId, owed, unstake);
    }

    /**
     * Emergency measure to unstake tokens.
     * @param tokenIds: the IDs of the tokens to claim earnings from
     */
    function rescue(uint256[] calldata tokenIds) external {
        require(rescueEnabled, "RESCUE DISABLED");
        require(tx.origin == _msgSender());

        uint256 tokenId;
        Stake memory stake;
        Stake memory lastStake;
        uint256 alpha;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];

            if (isVirgin(tokenId)) {
                stake = memeverse[tokenId];
                require(stake.owner == _msgSender(), "Not yours to take!");

                delete memeverse[tokenId];
                totalVirginsStaked -= 1;

                doge.safeTransferFrom(
                    address(this),
                    _msgSender(),
                    tokenId,
                    ""
                ); // send back Virgins

                emit VirginsClaimed(tokenId, 0, true);
            } else {
                alpha = _alphaForChad(tokenId);
                stake = gym[alpha][gymIndices[tokenId]];

                require(stake.owner == _msgSender(), "SWIPER, NO SWIPING");

                totalAlphaStaked -= alpha; // remove alpha from total staked
                lastStake = gym[alpha][gym[alpha].length - 1];
                gym[alpha][gymIndices[tokenId]] = lastStake; // shuffle last Chad to current position
                gymIndices[lastStake.tokenId] = gymIndices[tokenId];
                gym[alpha].pop(); // remove duplicate
                delete gymIndices[tokenId]; // delete previous mapping

                doge.safeTransferFrom(
                    address(this),
                    _msgSender(),
                    tokenId,
                    ""
                ); // send back Chad

                emit ChadsClaimed(tokenId, 0, true);
            }
        }
    }

    /** ACCOUNTING */

    /**
     * add $MEME to claimable pot for the gym
     * @param amount $MEME to add to the pot
     */
    function _payChadTax(uint256 amount) internal {
        if (totalAlphaStaked == 0) {      // if there are 0 staked Chads
            unaccountedRewards += amount; // keep track of $MEME due to Chads
            return;
        }
        // make sure to include any unaccounted $MEME
        memePerAlpha += (amount + unaccountedRewards) / totalAlphaStaked;
        unaccountedRewards = 0;
    }

    /**
     * tracks $MEME earnings to ensure it stops once 2.4 billion is passed
     */
    modifier _updateEarnings() {
        if (totalMemeEarned < MAXIMUM_GLOBAL_MEME) {
            totalMemeEarned +=
                ((block.timestamp - lastClaimTimestamp) *
                    totalVirginsStaked *
                    DAILY_MEME_RATE) /
                1 days;
            lastClaimTimestamp = block.timestamp;
        }
        _;
    }

    /** ADMIN */

    /**
     * Allows owner to enable "rescue mode".
     * Simplifies accounting, prioritizes tokens out in emergency.
     */
    function setRescueEnabled(bool _enabled) external onlyOwner {
        rescueEnabled = _enabled;
    }

    /**
     * Enables owner to pause/unpause minting
     */
    function setPaused(bool _paused) external onlyOwner {
        if (_paused) _pause();
        else _unpause();
    }

    /** READ ONLY */

    /**
     * Checks if a token is a Virgin
     * @param tokenId: the ID of the token to check
     */
    function isVirgin(uint256 tokenId) public view returns (bool virgin) {
        IDoge.ChadVirgin memory iChadVirgin = doge.getTokenTraits(tokenId);
        return iChadVirgin.isVirgin;
    }

    /**
     * Gets the alpha score for a Chad
     * @param tokenId: the ID of the Chad to get the alpha score for
     * @return the alpha score of the Chad (5-8)
     */
    function _alphaForChad(uint256 tokenId) internal view returns (uint8) {
        IDoge.ChadVirgin memory iChadVirgin = doge.getTokenTraits(tokenId);
        return MAX_ALPHA - iChadVirgin.alphaIndex; // alpha index is 0-3
    }

    /**
    * generates a pseudorandom number
    * @param seed a value ensure different outcomes for different sources in the same block
    * @return a pseudorandom value
    */
    function random(uint256 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
        tx.origin,
        blockhash(block.number - 1),
        block.timestamp,
        seed
        )));
    }

    /**
     * Chooses a random Chad thief when a newly minted token is stolen.
     * @param seed: a random value to choose a Chad from
     * @return the owner of the randomly selected Chad thief
     */
    function randomChadOwner(uint256 seed) external view returns (address) {
        require(address(msg.sender) == address(doge));

        if (totalAlphaStaked == 0) return address(0x0); // check if there are any staked Chads

        // Choose a value from 0 to totalAlphaStaked
        uint256 bucket = (seed & 0xFFFFFFFF) % totalAlphaStaked;
        uint256 cumulative;
        seed >>= 32;

        // Loop through each bucket of Chads with the same alpha score
        for (uint256 i = MAX_ALPHA - 3; i <= MAX_ALPHA; i++) {
            cumulative += gym[i].length * i;
            // If the value is not inside of that bucket, keep going
            if (bucket >= cumulative) continue;
            // Get the address of a random Chad with that alpha score
            return gym[i][seed % gym[i].length].owner;
        }

        return address(0x0);
    }

    function onERC721Received(address, address from, uint256, bytes calldata) external pure override returns (bytes4) {
        require(from == address(0x0), "Cannot send tokens to Memeverse directly");
        return IERC721Receiver.onERC721Received.selector;
    }
}
