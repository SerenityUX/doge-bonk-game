import { useState, useEffect, useRef, useMemo } from 'react';
import Image from "next/image";

// Move all the animations and sound functions outside the component
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

const playDamageSound = () => {
  const audio = new Audio('/damage.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

const playDeathSound = () => {
  const audio = new Audio('/horse_death.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

const playWinSound = () => {
  const audio = new Audio('/win-sound.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

const playXPSound = () => {
  const audio = new Audio('/xp.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

const getTimerDuration = (wordIndex) => {
  const baseDuration = 7500;
  const minDuration = 2500;
  const reductionPerWord = 500;
  
  const newDuration = baseDuration - (wordIndex * reductionPerWord);
  return Math.max(newDuration, minDuration);
};

function playHurtSound() {
    const sounds = ['/damage.mp3', '/dog_hurt.mp3'];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = new Audio(randomSound);
    audio.play();
}

export default function WordGame({ 
  question, 
  answer, 
  words, 
  onComplete, 
  onTimeout, 
  initialLives,
  gameId,
  isSelected,
  onSelect,
  numberOfDeaths,
  setNumberOfDeaths
}) {
  console.log(`Game ${gameId} initializing with:`, {
    question: question.slice(0, 30) + "...",
    answerLength: answer.split(" ").length,
    initialLives,
    timestamp: new Date().toISOString()
  });

  const [lives, setLives] = useState(() => {
    console.log(`Setting initial lives for game ${gameId}:`, initialLives);
    return initialLives;
  });

  // Add effect to track lives changes
  useEffect(() => {
    console.log(`Lives changed in game ${gameId}:`, lives);
  }, [lives, gameId]);

  const [selectedWords, setSelectedWords] = useState([]);
  const [currentChoices, setCurrentChoices] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState([]);
  const [progress, setProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastClicked, setLastClicked] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(null);

  const getWordColor = (index) => {
    if (wordStatuses[index] === 'correct') return '#00AA00'; // Dark Green
    if (wordStatuses[index] === 'incorrect') return '#AA0000'; // Dark Red
    return '#FFFFFF'; // White
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const updateChoices = () => {
    const currentAnswer = answer.toLowerCase().split(" ");
    const correctWord = currentAnswer[currentWordIndex];
    
    const wrongWords = shuffleArray(words
      .filter(word => word.toLowerCase() !== correctWord))
      .slice(0, 2);
    
    const choices = shuffleArray([correctWord, ...wrongWords]);
    setCurrentChoices(choices);
  };

  useEffect(() => {
    if (currentWordIndex < answer.split(" ").length) {
      updateChoices();
    }
  }, [currentWordIndex, answer]);

  useEffect(() => {
    updateChoices();
  }, []);

  const handleWordSelect = (word, index) => {
    if (isGameOver) return;
    
    const currentAnswer = answer.toLowerCase().split(" ");
    const isCorrect = word.toLowerCase() === currentAnswer[currentWordIndex];
    
    setLastClicked(index);
    setWasCorrect(isCorrect);
    
    setTimeout(() => {
      setLastClicked(null);
      setWasCorrect(null);
    }, 300);

    if (isCorrect) {
      playXPSound();
      setSelectedWords([...selectedWords, word]);
      setWordStatuses([...wordStatuses, 'correct']);
      
      if (currentWordIndex === currentAnswer.length - 1) {
        playWinSound();
        const element = document.getElementById(`game-${gameId}`);
        if (element) {
          element.remainingLives = lives;
        }
        onComplete?.();
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      playHurtSound();
      setSelectedWords([...selectedWords, currentAnswer[currentWordIndex]]);
      setWordStatuses([...wordStatuses, 'incorrect']);
      
      if (newLives <= 0) {
        setIsGameOver(true);
        playDeathSound();
        setNumberOfDeaths(prev => prev + 1);
        onTimeout?.();
        return;
      }
    }
    
    setCurrentWordIndex(currentWordIndex + 1);
    setProgress(0);
    
    if (!gameStarted) {
      setGameStarted(true);
    }
  };

  useEffect(() => {
    const handleMouseEnter = () => {
      onSelect();
    };

    const element = document.getElementById(`game-${gameId}`);
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      return () => element.removeEventListener('mouseenter', handleMouseEnter);
    }
  }, [gameId, onSelect]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isSelected || currentWordIndex >= answer.split(" ").length) return;
      
      const key = event.key;
      if (key === "1" || key === "2" || key === "3") {
        const index = parseInt(key) - 1;
        if (index < currentChoices.length) {
          handleWordSelect(currentChoices[index], index);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentChoices, currentWordIndex, isSelected]);

  useEffect(() => {
    if (!gameStarted || currentWordIndex >= answer.split(" ").length || isGameOver) return;

    const startTime = Date.now();
    const duration = getTimerDuration(currentWordIndex);

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, (elapsed / duration) * 100);
      
      if (current === 100) {
        const currentAnswer = answer.toLowerCase().split(" ");
        setSelectedWords([...selectedWords, currentAnswer[currentWordIndex]]);
        setWordStatuses([...wordStatuses, 'incorrect']);
        const newLives = lives - 1;
        setLives(newLives);
        playHurtSound();
        
        if (newLives <= 0) {
          setIsGameOver(true);
          playDeathSound();
          setNumberOfDeaths(prev => prev + 1);
          onTimeout?.();
        }
        
        setCurrentWordIndex(currentWordIndex + 1);
        setProgress(0);
      } else {
        setProgress(current);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [currentWordIndex, gameStarted, isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      onTimeout?.();
    }
  }, [isGameOver]);

  useEffect(() => {
    if (currentWordIndex === answer.split(" ").length) {
      onComplete?.();
    }
  }, [currentWordIndex, answer]);

  // Add function to force game over
  const forceGameOver = () => {
    setLives(0);
    setIsGameOver(true);
    playDeathSound();
    onTimeout?.();
  };

  // Expose forceGameOver through ref
  useEffect(() => {
    const element = document.getElementById(`game-${gameId}`);
    if (element) {
      element.forceGameOver = forceGameOver;
    }
  }, [gameId]);

  return (
    <div id={`game-${gameId}`}>
      <style>{jiggleKeyframes}</style>
      <div style={{
        padding: 8, 
        border: `2px solid ${isGameOver ? "#AA0000" : isSelected ? "#5555FF" : "#AAAAAA"}`,
        display: 'flex', 
        flexDirection: "column", 
        width: "300px",
        minHeight: '200px',
        maxHeight: '400px',
        wordWrap: "break-word",
        wordBreak: "break-word",
        transition: 'border 0.1s ease',
        position: 'relative',
        backgroundColor: '#FFFFFF',
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
        imageRendering: 'pixelated',
        overflowY: 'auto'
      }}>
        <p style={{ margin: '4px 0' }}>{question}</p>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: '8px',
          maxHeight: '150px',
          overflowY: 'auto',
          padding: '4px'
        }}>
          {isGameOver ? (
            answer.split(" ").map((word, index) => (
              <span key={index} style={{ 
                color: index < selectedWords.length ? getWordColor(index) : '#AAAAAA',
                fontSize: '14px',
                lineHeight: '1.2',
                display: 'inline-block'
              }}>
                {index < selectedWords.length ? selectedWords[index] : word}
                {' '}
              </span>
            ))
          ) : (
            selectedWords.map((word, index) => (
              <span key={index} style={{ 
                color: getWordColor(index),
                fontSize: '14px',
                lineHeight: '1.2',
                display: 'inline-block'
              }}>
                {word}
                {' '}
              </span>
            ))
          )}
        </div>
        {currentWordIndex < answer.split(" ").length && currentChoices.map((word, index) => (
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
        {currentWordIndex === answer.split(" ").length ? (
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
        <div style={{
          display: 'flex',
          gap: '6px',
          marginTop: '12px',
          marginBottom: '8px',
          justifyContent: 'flex-start',
          paddingLeft: '4px'
        }}>
          {[...Array(initialLives)].map((_, index) => (
            <div key={index} style={{
              imageRendering: 'pixelated',
              width: '24px',
              height: '24px',
              position: 'relative',
              animation: gameStarted && progress > 0 ? 'jiggle 0.3s infinite' : 'none',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '24px',
                height: '24px',
                opacity: index < lives ? 1 : 0,
                animation: index === lives ? 'heartFade 0.5s forwards' : 'none',
              }}>
                <Image
                  src="/Heart_filled.webp"
                  alt="Life remaining"
                  width={24}
                  height={24}
                  style={{
                    imageRendering: 'pixelated',
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '24px',
                height: '24px',
                opacity: index < lives ? 0 : 1,
                animation: index === lives ? 'heartFade 0.5s forwards' : 'none',
              }}>
                <Image
                  src="/Heart_unfilled.webp"
                  alt="Life lost"
                  width={24}
                  height={24}
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
      </div>
    </div>
  );
} 