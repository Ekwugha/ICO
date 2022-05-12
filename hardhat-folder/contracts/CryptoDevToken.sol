// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {

    // CryptoDevsNFT contract instance created  
    ICryptoDevs CryptoDevsNFT;

    // Mapping to keep track of which tokenIds have been claimed
    mapping(uint256 => bool) public tokenIdsClaimed;

    // price of a cryptoDev token
    uint256 public constant tokenPrice = 0.001 ether;

    // Each NFT will give the user 10tokens
    uint256 public constant tokensPerNFT = 10 * 10**18;

    // the maximum total supply is 10000 for Crypto Dev Tokens
    uint256 public constant maxTotalSupply = 10000 * 10**18;

    constructor(address _cryproDevsContract) ERC20("Crypto Dev Token", "CD") {
        CryptoDevsNFT = ICryptoDevs(_cryproDevsContract);
    }

    function mint(uint256 amount) public payable {
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Ether sent is incorrect");
        uint256 amountWithDecimals = amount * 10**18;
        require((totalSupply() + amountWithDecimals) <= maxTotalSupply, "Exceeds the max total supply available.");
        _mint(msg.sender, amountWithDecimals);

    }


    function claim() public {
        address sender =  msg.sender;
        uint256 balance = CryptoDevsNFT.balanceOf(sender);
        require(balance > 0, "You do not own any Crypto Dev NFTs");
        uint256 amount = 0;

        for(uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
            // increase the amount of the tokenid if t=it has not been claimed
            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }   
        // If all the token Ids have been claimed, revert the transaction;
        require(amount > 0, "You have already claimed all the tokens");
        // call the internal function from Openzeppelin's ERC20 contract
        // Mint (amount * 10) tokens for each NFT
        _mint(msg.sender, amount * tokensPerNFT);
    }

    // these functions recieves ethers for different conditions
    receive() external payable{}
    fallback() external payable{}

}