// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable { 
    uint256 public _tokenIds;   
    uint256 public constant MAX_SUPPLY = 100;
    mapping(address => bool) private _hasMinted;

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/";
    }

    function mintNFT(address recipient, string memory _tokenURI) public returns (uint256) {
        require(_tokenIds < MAX_SUPPLY, "Maximum minting limit reached");
        require(!_hasMinted[recipient], "Each address can only mint one NFT");
        
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _safeMint(recipient, newItemId);
        _hasMinted[recipient] = true;
        return newItemId;
    }
}
