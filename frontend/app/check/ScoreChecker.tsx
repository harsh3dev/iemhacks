'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import axios from 'axios'

export default function ScoreChecker() {
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [trustScore, setTrustScore] = useState(0)
  const [error, setError] = useState('')
  const [pollStatus, setPollStatus] = useState('')
  // Toggle between mock and real API
  const useMockData = false

  // Mock function to generate a random trust score
  const generateMockTrustScore = () => {
    // Generate a random number between 0 and 100
    return Math.floor(Math.random() * 101);
  }

  // Helper function to create a delay
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Poll the backend API for results
  const pollBackend = async () => {
    try {
      const response = await axios.post(
        "https://coral-app-ejwbw.ondigitalocean.app/address/process_eth_address",
        { address: address }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error polling backend:", error);
      return null;
    }
  };

  const checkTrustScore = async () => {
    try {
        // Validate if the address starts with "0x"
        if (!address.startsWith('0x')) {
          setError('Invalid Ethereum address. Address must start with "0x"');
          return;
        }
        
        setIsLoading(true);
        setError('');
        setPollStatus('Starting calculation...');
        
        if (useMockData) {
          // Use mock data after a small delay to simulate network request
          setTimeout(() => {
            const mockScore = generateMockTrustScore();
            console.log("Mock trust score:", mockScore);
            setTrustScore(mockScore);
            setIsLoading(false);
            setShowResult(true);
          }, 1500); // 1.5 second delay for realism
        } else {
          // Use the real API with polling
          const startTime = Date.now();
          const timeout = 10 * 60 * 1000; // 10 minutes timeout
          
          while (true) {
            setPollStatus('Polling for results...');
            const result = await pollBackend();
            const elapsedTime = Date.now() - startTime;
            
            if (result) {
              if (result.calculated) {
                const score = parseFloat(result.score).toFixed(2);
                console.log("API trust score:", score);
                setTrustScore(Number(score));
                setIsLoading(false);
                setShowResult(true);
                break;
              } else {
                setPollStatus('Calculation in progress...');
              }
            } else {
              setError('Error communicating with the API. Please try again.');
              setIsLoading(false);
              break;
            }
            
            if (elapsedTime >= timeout) {
              setError('Calculation timed out. Please try again later.');
              setIsLoading(false);
              break;
            }
            
            // Wait 5 seconds before polling again
            await delay(5000);
          }
        }
    } catch (error) {
      console.error("Error fetching trust score:", error);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score <= 50) return 'text-red-400'
    if (score <= 75) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getScoreBackground = (score: number) => {
    if (score <= 50) return 'bg-red-900/20'
    if (score <= 75) return 'bg-yellow-900/20'
    return 'bg-green-900/20'
  }

  const getScoreMessage = (score: number) => {
    if (score <= 50) return 'High Risk'
    if (score <= 75) return 'Moderate Risk'
    return 'Safe'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-3xl font-bold text-center text-violet-200">CryptoSecure Trust Score Checker</h1>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter blockchain wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-lg py-6 px-4 bg-gray-800 text-violet-100 border-violet-500 placeholder-violet-400"
          />

          <button 
            onClick={checkTrustScore}
            disabled={isLoading || address.trim() === ''}
            className="w-full checkButton cursor-pointer "
          >
            <span className=' flex justify-center items-center '>
            {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {pollStatus}
                </>
              ) : (
                'Check Score'
              )}
            </span>
          </button>
          
          {error && (
            <div className="text-red-400 text-center mt-2">{error}</div>
          )}
            
        </div>

        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent className="bg-gray-800 text-violet-100">
            <DialogHeader>
              <DialogTitle className="text-violet-200">Trust Score Result</DialogTitle>
              <DialogDescription className="text-violet-300">
                The projected trust score for the wallet address:
              </DialogDescription>
            </DialogHeader>
            <div className={`flex flex-col items-center justify-center p-6 rounded-lg ${getScoreBackground(trustScore)}`}>
              <div className={`text-7xl font-bold ${getScoreColor(trustScore)}`}>{trustScore}</div>
              <div className={`mt-2 text-xl font-semibold ${getScoreColor(trustScore)}`}>
                {getScoreMessage(trustScore)}
              </div>
            </div>
            <div className="text-center text-sm text-violet-400 mt-4">
              Score range: 0-50 (High Risk), 51-75 (Moderate Risk), 76-100 (Safe)
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}