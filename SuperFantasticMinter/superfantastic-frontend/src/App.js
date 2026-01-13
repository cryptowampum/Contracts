import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera } from 'lucide-react';
import { ethers } from 'ethers';

// Contract configuration
const CONTRACT_ADDRESS = '0xF993f484225900D2Be4F7253Cfd4Ab14fC9f4621';
const POLYGON_CHAIN_ID = 137;
const BACKEND_API_URL = 'http://localhost:3001'; // Change to your backend URL in production

const ABI = [
  "function teamMint(address recipient, string customImage, string customText, string eventName, uint256 eventDate) external",
  "function mintPrice() view returns (uint256)",
  "function teamMinters(address) view returns (bool)"
];

export default function TeamMinter() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [isTeamMinter, setIsTeamMinter] = useState(false);
  const [mintPrice, setMintPrice] = useState('0');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  
  // Form state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [customText, setCustomText] = useState('Great connecting at the event!');
  const [eventName, setEventName] = useState('Networking Event');
  const [eventDate, setEventDate] = useState('');
  
  // Photo state
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [useDefaultImage, setUseDefaultImage] = useState(true);
  
  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Set default event date to now
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setEventDate(now.toISOString().slice(0, 16));
  }, []);

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        showAlert('Please install MetaMask or a Web3 wallet', 'error');
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await ethersProvider.getNetwork();
      
      if (network.chainId !== POLYGON_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x89' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/']
              }]
            });
          }
        }
      }
      
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      console.log('Connected to:', address);
      console.log('Contract address:', CONTRACT_ADDRESS);
      console.log('Network:', network.chainId);
      
      // Check if contract exists
      const code = await ethersProvider.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        showAlert('⚠️ No contract found at this address! Please update CONTRACT_ADDRESS.', 'error');
        return;
      }
      
      // Check if team minter
      const isAuthorized = await contractInstance.teamMinters(address);
      
      // Get mint price
      const price = await contractInstance.mintPrice();
      const priceInPOL = ethers.utils.formatEther(price);
      
      setProvider(ethersProvider);
      setContract(contractInstance);
      setAccount(address);
      setConnected(true);
      setIsTeamMinter(isAuthorized);
      setMintPrice(priceInPOL);
      
      if (!isAuthorized) {
        showAlert('⚠️ Warning: Your wallet is not authorized as a team minter!', 'warning');
      } else {
        showAlert('✅ Connected successfully!', 'success');
      }
      
    } catch (error) {
      console.error(error);
      showAlert(`Connection failed: ${error.message}`, 'error');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      showAlert('Camera access denied. Please enable camera permissions.', 'error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Compress to target size
      let quality = 0.9;
      const targetFileSize = 700 * 1024; // 700KB
      
      const tryCompress = (q) => {
        canvas.toBlob((blob) => {
          console.log(`Captured with quality ${q}: ${(blob.size / 1024).toFixed(2)}KB`);
          
          if (blob.size > targetFileSize && q > 0.3) {
            tryCompress(q - 0.1);
          } else {
            setPhoto(blob);
            setPhotoPreview(URL.createObjectURL(blob));
            setUseDefaultImage(false);
            stopCamera();
            showAlert(`Photo captured: ${(blob.size / 1024).toFixed(2)}KB`, 'success');
          }
        }, 'image/jpeg', q);
      };
      
      tryCompress(quality);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      resizeImage(file);
    }
  };

  const resizeImage = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Target max dimensions and file size
        const maxWidth = 1920;
        const maxHeight = 1920;
        const targetFileSize = 700 * 1024; // 700KB target
        
        // First resize by dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to hit target size
        let quality = 0.9;
        const tryCompress = (q) => {
          canvas.toBlob((blob) => {
            console.log(`Compressed with quality ${q}: ${(blob.size / 1024).toFixed(2)}KB`);
            
            if (blob.size > targetFileSize && q > 0.3) {
              // Too big, try lower quality
              tryCompress(q - 0.1);
            } else {
              // Good enough or at minimum quality
              setPhoto(blob);
              setPhotoPreview(URL.createObjectURL(blob));
              setUseDefaultImage(false);
              showAlert(`Photo loaded: ${(blob.size / 1024).toFixed(2)}KB`, 'success');
            }
          }, 'image/jpeg', q);
        };
        
        tryCompress(quality);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const uploadToPinata = async () => {
    if (!photo) {
      showAlert('Please capture or select a photo first', 'error');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', photo, 'photo.jpg');
      
      const response = await fetch(`${BACKEND_API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      const data = await response.json();
      setIpfsUrl(data.ipfsUrl);
      showAlert('✅ Uploaded to IPFS!', 'success');
      
    } catch (error) {
      showAlert(`Upload failed: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const resolveAddress = useCallback(async () => {
    const input = recipientAddress.trim();
    
    if (!input) {
      setResolvedAddress('');
      return;
    }
    
    // Check if it's already an address
    if (input.startsWith('0x') && input.length === 42) {
      setResolvedAddress(input);
      return;
    }
    
    // Try ENS resolution for any domain name
    // ENS supports .eth, .com, .ac, and many other TLDs
    if (input.includes('.')) {
      if (!provider) {
        showAlert('Connect wallet first to resolve ENS', 'warning');
        return;
      }
      
      try {
        // Use mainnet provider for ENS (Polygon doesn't have ENS)
        const mainnetProvider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');
        const resolved = await mainnetProvider.resolveName(input);
        
        if (resolved) {
          setResolvedAddress(resolved);
          showAlert(`✅ Resolved ${input} to ${resolved.slice(0, 6)}...${resolved.slice(-4)}`, 'success');
        } else {
          showAlert(`ENS name "${input}" not found or not configured`, 'error');
          setResolvedAddress('');
        }
      } catch (error) {
        console.error('ENS resolution error:', error);
        showAlert(`Could not resolve "${input}"`, 'error');
        setResolvedAddress('');
      }
      return;
    }
    
    // Invalid format
    showAlert('Please enter a valid address or ENS name', 'error');
    setResolvedAddress('');
  }, [recipientAddress, provider]);

  useEffect(() => {
    if (recipientAddress && provider) {
      const timer = setTimeout(() => resolveAddress(), 500);
      return () => clearTimeout(timer);
    }
  }, [recipientAddress, provider, resolveAddress]);

  const handleMint = async () => {
    if (!isTeamMinter) {
      showAlert('You are not authorized as a team minter', 'error');
      return;
    }
    
    if (!resolvedAddress) {
      showAlert('Please enter a valid recipient address', 'error');
      return;
    }
    
    // Use default image or uploaded image
    const finalIpfsUrl = useDefaultImage ? '' : ipfsUrl;
    
    if (!useDefaultImage && !ipfsUrl) {
      showAlert('Please upload a photo to IPFS first, or use default image', 'error');
      return;
    }
    
    if (!eventName) {
      showAlert('Please enter an event name', 'error');
      return;
    }
    
    setMinting(true);
    try {
      const timestamp = Math.floor(new Date(eventDate).getTime() / 1000);
      
      const tx = await contract.teamMint(
        resolvedAddress,
        finalIpfsUrl,  // Empty string will use contract's baseImageURI
        customText,
        eventName,
        timestamp
      );
      
      showAlert('Transaction sent! Waiting for confirmation...', 'info');
      
      await tx.wait();
      
      showAlert(`🎉 NFT Minted Successfully! TX: ${tx.hash.slice(0, 10)}...`, 'success');
      
      // Reset form
      setRecipientAddress('');
      setResolvedAddress('');
      setCustomText('Great connecting at the event!');
      setPhoto(null);
      setPhotoPreview(null);
      setIpfsUrl('');
      setUseDefaultImage(true);
      
    } catch (error) {
      showAlert(`Mint failed: ${error.message}`, 'error');
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-6">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">🦄 SuperFantastic</h1>
        <p className="text-gray-600 mb-6">Team Minting Interface</p>
        
        {alert.show && (
          <div className={`p-4 rounded-lg mb-4 ${
            alert.type === 'success' ? 'bg-green-100 text-green-800' :
            alert.type === 'error' ? 'bg-red-100 text-red-800' :
            alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {alert.message}
          </div>
        )}
        
        {!connected ? (
          <div className="text-center py-12">
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition"
            >
              🔌 Connect Wallet
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Connect your authorized team minting wallet
            </p>
          </div>
        ) : (
          <div>
            {/* Status Bar */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-600">Wallet: </span>
                  <span className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Mint Price: </span>
                  <span className="font-bold">{mintPrice} POL</span>
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  isTeamMinter ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isTeamMinter ? '✅ Authorized Team Minter' : '❌ Not Authorized'}
                </span>
              </div>
            </div>

            {/* Photo Section */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">📸 Photo (Optional - uses default if not provided)</h3>
              
              {!photoPreview ? (
                <div className="space-y-3">
                  <div className="bg-gray-100 p-4 rounded-lg text-center text-sm text-gray-600">
                    ℹ️ No photo selected - will use contract's default image
                  </div>
                  {!cameraActive ? (
                    <>
                      <button
                        onClick={startCamera}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                      >
                        <Camera size={20} />
                        Take Photo with Camera
                      </button>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                      >
                        📁 Choose from Device
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </>
                  ) : (
                    <div className="space-y-3">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={capturePhoto}
                          className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                        >
                          📷 Capture
                        </button>
                        <button
                          onClick={stopCamera}
                          className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <img src={photoPreview} alt="Preview" className="w-full rounded-lg" />
                  <div className="flex gap-2">
                    {!ipfsUrl ? (
                      <>
                        <button
                          onClick={uploadToPinata}
                          disabled={uploading}
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                          {uploading ? '⏳ Uploading...' : '☁️ Upload to IPFS'}
                        </button>
                        <button
                          onClick={() => {
                            setPhoto(null);
                            setPhotoPreview(null);
                          }}
                          className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
                        >
                          🔄 Retake
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 bg-green-100 text-green-800 py-3 rounded-lg font-semibold text-center">
                        ✅ Uploaded to IPFS
                      </div>
                    )}
                  </div>
                  {ipfsUrl && (
                    <p className="text-xs text-gray-500 break-all">{ipfsUrl}</p>
                  )}
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Recipient */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">Recipient Address *</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x... or name.eth or ethdenver.com"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
              {resolvedAddress && (
                <p className="text-xs text-green-600 mt-1">✅ Resolved to: {resolvedAddress}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Supports all ENS domains: .eth, .com, .ac, etc.</p>
            </div>

            {/* Custom Text */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">Personal Message</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Great talking about Web3!"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                rows="3"
              />
              <p className="text-xs text-gray-500 mt-1">Pre-filled with default message</p>
            </div>

            {/* Event Name */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="ETH Denver 2025"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Pre-filled with default event name</p>
            </div>

            {/* Event Date */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">Event Date</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Defaults to current date/time</p>
            </div>

            {/* Mint Button */}
            <button
              onClick={handleMint}
              disabled={!isTeamMinter || !resolvedAddress || !eventName || minting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {minting ? '⏳ Minting...' : '✨ Mint NFT (FREE for Team)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}