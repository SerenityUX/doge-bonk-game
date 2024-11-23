import Head from "next/head";
import Image from "next/image";
import localFont from "next/font/local";
import styles from "@/styles/Home.module.css";
import { useState, useEffect } from 'react';

// Add a keyframes style at the top of your component
const jiggleKeyframes = `
  @keyframes jiggle {
    0% { transform: translateY(0px); }
    25% { transform: translateY(-2px); }
    75% { transform: translateY(2px); }
    100% { transform: translateY(0px); }
  }

  @keyframes heartFade {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0; transform: scale(1.2); }
    100% { opacity: 1; transform: scale(1); }
  }

  @keyframes correctFlash {
    0% { background-color: #FFFFFF; color: #000000; }
    50% { background-color: #00AA00; color: #FFFFFF; }
    100% { background-color: #FFFFFF; color: #000000; }
  }

  @keyframes incorrectFlash {
    0% { background-color: #FFFFFF; color: #000000; }
    50% { background-color: #AA0000; color: #FFFFFF; }
    100% { background-color: #FFFFFF; color: #000000; }
  }
`;

// Add at the top with other imports and before the component
const playDamageSound = () => {
  const audio = new Audio('/damage.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

const playDeathSound = () => {
  const audio = new Audio('/horse_death.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

// Update the timer duration function
const getTimerDuration = (wordIndex) => {
  const baseDuration = 2500; // Start with 2.5 seconds
  const minDuration = 1000;  // Don't go lower than 1 second
  const reductionPerWord = 100; // Reduce by 0.1 seconds per word
  
  const newDuration = baseDuration - (wordIndex * reductionPerWord);
  return Math.max(newDuration, minDuration); // Don't go below minimum duration
};

export default function Home() {
  const [mistakes, setMistakes] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [currentChoices, setCurrentChoices] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState([]);
  const [progress, setProgress] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [lives, setLives] = useState(5);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [lastClicked, setLastClicked] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(null);

  const questions = [
    {
      question: "what type of lemon is the sweetest?",
      answer: "Meyer lemons are generally considered the sweetest variety of lemons, as they are actually a hybrid between a regular lemon and a mandarin orange."
    }
  ];

  const words = [
    "the", "be", "to", "of", "and", "a", "in", "that",
    "have", "I", "it", "for", "not", "on", "with", "he",
    "as", "you", "do", "at", "this", "but", "his", "by",
    "from", "they", "we", "say", "her", "she", "or", "an",
    "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which",
    "go", "me", "when", "make", "can", "like", "time", "no",
    "just", "him", "know", "take", "people", "into", "year", "your",
    "good", "some", "could", "them", "see", "other", "than", "then",
    "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first",
    "well", "way", "even", "new", "want", "because", "any", "these",
    "give", "day", "most", "us", "is", "was", "are", "were"
  ];

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const updateChoices = () => {
    const currentAnswer = questions[0].answer.toLowerCase().split(" ");
    const correctWord = currentAnswer[currentWordIndex];
    
    // Get random words from the words array that aren't the correct word
    const wrongWords = shuffleArray(words
      .filter(word => word.toLowerCase() !== correctWord))
      .slice(0, 2);
    
    // Combine correct word with wrong words and shuffle
    const choices = shuffleArray([correctWord, ...wrongWords]);
    setCurrentChoices(choices);
  };

  // Update choices when currentWordIndex changes
  useEffect(() => {
    if (currentWordIndex < questions[0].answer.split(" ").length) {
      updateChoices();
    }
  }, [currentWordIndex]);

  // Initial choices setup
  useEffect(() => {
    updateChoices();
  }, []);

  // Update the timer effect to use dynamic duration
  useEffect(() => {
    if (!gameStarted || !timerActive || currentWordIndex >= questions[0].answer.split(" ").length || isGameOver) return;

    const startTime = Date.now();
    const duration = getTimerDuration(currentWordIndex);

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, (elapsed / duration) * 100);
      
      if (current === 100) {
        const currentAnswer = questions[0].answer.toLowerCase().split(" ");
        setSelectedWords([...selectedWords, currentAnswer[currentWordIndex]]);
        setWordStatuses([...wordStatuses, 'incorrect']);
        const newLives = lives - 1;
        setLives(newLives);
        playDamageSound();
        
        if (newLives <= 0) {
          setIsGameOver(true);
          playDeathSound();
        }
        
        setCurrentWordIndex(currentWordIndex + 1);
        setProgress(0);
      } else {
        setProgress(current);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [timerActive, currentWordIndex, gameStarted, isGameOver]);

  // Reset progress when moving to next word
  useEffect(() => {
    setProgress(0);
  }, [currentWordIndex]);

  // Modify handleWordSelect to start the game on first selection
  const handleWordSelect = (word, index) => {
    if (isGameOver) return;
    
    const currentAnswer = questions[0].answer.toLowerCase().split(" ");
    const isCorrect = word.toLowerCase() === currentAnswer[currentWordIndex];
    
    setLastClicked(index);
    setWasCorrect(isCorrect);
    
    // Reset animation states after animation completes
    setTimeout(() => {
      setLastClicked(null);
      setWasCorrect(null);
    }, 300);

    if (isCorrect) {
      setSelectedWords([...selectedWords, word]);
      setWordStatuses([...wordStatuses, 'correct']);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      playDamageSound();
      setSelectedWords([...selectedWords, currentAnswer[currentWordIndex]]);
      setWordStatuses([...wordStatuses, 'incorrect']);
      
      if (newLives <= 0) {
        setIsGameOver(true);
        playDeathSound();
      }
    }
    
    setCurrentWordIndex(currentWordIndex + 1);
    setProgress(0);
    
    if (!gameStarted) {
      setGameStarted(true);
    }
  };

  const getWordColor = (index) => {
    if (wordStatuses[index] === 'correct') return '#00AA00';
    if (wordStatuses[index] === 'incorrect') return '#AA0000';
    return '#FFFFFF';
  };

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (currentWordIndex >= questions[0].answer.split(" ").length) return;
      
      const key = event.key;
      if (key === "1" || key === "2" || key === "3") {
        const index = parseInt(key) - 1;
        if (index < currentChoices.length) {
          handleWordSelect(currentChoices[index], index);
          setShowTip(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentChoices, currentWordIndex]);

  return (
    <>
      <Head>
        <title>Doge Bonk Game</title>
        <meta name="description" content="you become a doge LLM. embrace the chaos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style>{jiggleKeyframes}</style>
      </Head>
      <div>
        <div style={{
          padding: 8, 
          border: isGameOver ? "2px solid #AA0000" : "1px solid #AAAAAA", 
          display: 'flex', 
          flexDirection: "column", 
          width: "250px",
          wordWrap: "break-word",
          wordBreak: "break-word",
          transition: 'border 0.3s ease',
          position: 'relative',
          backgroundColor: '#FFFFFF',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
          imageRendering: 'pixelated'
        }}>
          <p style={{ margin: '4px 0' }}>{questions[0].question}</p>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '8px'
          }}>
            {selectedWords.map((word, index) => (
              <span key={index} style={{ 
                color: getWordColor(index),
              }}>
                {word}
              </span>
            ))}
          </div>
          {currentWordIndex < questions[0].answer.split(" ").length && currentChoices.map((word, index) => (
            <button 
              key={index} 
              onClick={() => handleWordSelect(word, index)}
              disabled={isGameOver}
              style={{
                marginBottom: '4px',
                padding: '4px 8px',
                wordBreak: 'break-word',
                textAlign: 'left',
                width: '100%',
                display: 'block',
                opacity: isGameOver ? 0.5 : 1,
                cursor: isGameOver ? 'not-allowed' : 'pointer',
                backgroundColor: isGameOver ? '#555555' : '#FFFFFF',
                color: isGameOver ? '#AAAAAA' : '#000000',
                border: '1px solid #AAAAAA',
                position: 'relative',
                boxShadow: isGameOver ? 'none' : '2px 2px 0px rgba(0, 0, 0, 0.2)',
                imageRendering: 'pixelated',
                animation: lastClicked === index ? 
                  (wasCorrect ? 'correctFlash 0.3s forwards' : 'incorrectFlash 0.3s forwards') : 
                  'none'
              }}
            >
              [{index + 1}] {word.charAt(0).toUpperCase() + word.slice(1)} 
            </button>
          ))}
          {currentWordIndex === questions[0].answer.split(" ").length ? (
            <p style={{ margin: '4px 0' }}>Completed with {lives} hearts remaining!</p>
          ) : (
            <>
              {gameStarted && !isGameOver && (
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#555555',
                  marginBottom: '8px',
                  borderRadius: '2px'
                }}>
                  <div 
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: progress > 70 ? '#AA0000' : '#00AA00',
                      transition: 'width 50ms linear',
                      borderRadius: '2px'
                    }}
                  />
                </div>
              )}
            </>
          )}
          
          {/* Hearts moved to bottom with jiggle animation */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginTop: '12px',
            marginBottom: '8px',
            justifyContent: 'flex-start',
            paddingLeft: '4px'
          }}>
            {[...Array(5)].map((_, index) => (
              <div key={index} style={{
                imageRendering: 'pixelated',
                width: '20px',
                height: '20px',
                position: 'relative',
                animation: gameStarted && progress > 0 ? 'jiggle 0.3s infinite' : 'none',
              }}>
                {/* Filled heart */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '20px',
                  height: '20px',
                  opacity: index < lives ? 1 : 0,
                  animation: index === lives ? 'heartFade 0.5s forwards' : 'none',
                }}>
                  <Image
                    src="/Heart_filled.webp"
                    alt="Life remaining"
                    width={20}
                    height={20}
                    style={{
                      imageRendering: 'pixelated',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
                {/* Unfilled heart */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '20px',
                  height: '20px',
                  opacity: index < lives ? 0 : 1,
                  animation: index === lives ? 'heartFade 0.5s forwards' : 'none',
                }}>
                  <Image
                    src="/Heart_unfilled.webp"
                    alt="Life lost"
                    width={20}
                    height={20}
                    style={{
                      imageRendering: 'pixelated',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {showTip && (
            <p style={{
              fontSize: '12px', 
              color: '#AAAAAA',
              margin: '4px 0',
              textAlign: 'center'
            }}>Tip: Use keys 1, 2, or 3 to select quickly!</p>
          )}
        </div>
      </div>
    </>
  );
}
