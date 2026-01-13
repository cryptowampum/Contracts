curl -X POST "https://api.pinata.cloud/pinning/pinJSONToIPFS" \
  -H "Content-Type: application/json" \
  -H "pinata_api_key: c633a21b944c59db6a49" \
  -H "pinata_secret_api_key: 9808b623166c4cd12aff666573b268ba2dc724783d3088dc2b05dc9220bde219" \
  -d '{
    "name": "BitBasel Moonshot",
    "description": "Co-created NFT from BitBasel Miami Art Week.",
    "image": "ipfs://bafkreibzh3p2ukjoxdqccfxck5bnjqe6xs6i4rjq6um3ysva5xxqjm5txq"
  }'