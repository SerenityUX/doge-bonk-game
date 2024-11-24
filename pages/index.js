import Head from "next/head";
import WordGame from '../components/WordGame';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const calculateInitialLives = (answerLength) => {
  // More generous formula for longer answers:
  // - 3 hearts minimum
  // - Add 1 heart for every 12 words (instead of 8)
  // - Cap at 8 hearts maximum (instead of 10)
  const baseLives = Math.floor(answerLength / 12) + 3;
  return Math.min(Math.max(baseLives, 3), 8);
};

const fallingKeyframes = `
  @keyframes falling {
    from { top: 20px; }
    to { top: calc(100vh - 20px); }
  }
`;

// Add a unique ID generator
const generateUniqueId = () => `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Add sound function
const playDeathSound = () => {
  const audio = new Audio('/horse_death.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

// Add function to calculate distance from cursor to game container
const getDistanceFromCursor = (gameRect, cursorX, cursorY) => {
  // Get center point of game container
  const centerX = gameRect.left + (gameRect.width / 2);
  const centerY = gameRect.top + (gameRect.height / 2);
  
  // Calculate distance
  return Math.sqrt(
    Math.pow(cursorX - centerX, 2) + 
    Math.pow(cursorY - centerY, 2)
  );
};

// Add this near the top with other constants
const minecraftColors = [
  '#AA0000', // Dark Red
  '#FF5555', // Red
  '#FFAA00', // Gold
  '#FFFF55', // Yellow
  '#00AA00', // Dark Green
  '#55FF55', // Green
  '#55FFFF', // Aqua
  '#00AAAA', // Dark Aqua
  '#0000AA', // Dark Blue
  '#5555FF', // Blue
  '#FF55FF', // Light Purple
  '#AA00AA', // Dark Purple
];

const RainbowText = ({ text }) => {
  const [colorOffset, setColorOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorOffset(prev => (prev + 1) % text.length);
    }, 100); // Made it faster for smoother wave effect

    return () => clearInterval(interval);
  }, [text.length]);

  return (
    <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          style={{
            color: minecraftColors[
              ((index - colorOffset + text.length) % text.length) % minecraftColors.length
            ]
          }}
        >
          {char}
        </span>
      ))}
    </h1>
  );
};

// Add this near the top with other constants
const playBonkLoop = () => {
  const audio = new Audio('/bonk.mp3');
  audio.loop = true;
  return audio;
};

// Add this function after handleGameComplete
const selectNextAvailableGame = () => {
  if (activeGames.length > 0) {
    const nextGame = activeGames[0]; // Select the first available game
    setSelectedGameId(nextGame.id);
  }
};

export default function Home() {
  const [activeGames, setActiveGames] = useState([]);
  const [gameCounter, setGameCounter] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState([]);
  const [usedPositions, setUsedPositions] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [numberOfDeaths, setNumberOfDeaths] = useState(0);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [gameOverSound, setGameOverSound] = useState(null);

  const questions = [
    {
      question: "What shocking survival story involves the Shiba Inu breed?",
      answer: "During World War II, the Shiba Inu nearly went extinct! Only three bloodlines survived the widespread devastation, and all modern Shibas descend from these survivors."
    },
    {
      question: "What bizarre genetic trait makes Shiba Inus different from other dogs?", 
      answer: "Shiba Inus are one of the few dog breeds that possess a unique genetic makeup closest to wolves, making them one of the most ancient dog breeds in the world!"
    },
    {
      question: "What strange cleaning habit makes Shiba Inus cat-like?",
      answer: "Shiba Inus obsessively clean themselves like cats! They're known to lick their paws and body, and even wipe their face with their paws just like felines."
    },
    {
      question: "What incredible physical feat can Shiba Inus perform?",
      answer: "Shiba Inus can climb trees and jump to extraordinary heights! Some have been recorded jumping over 6-foot fences from a standing position."
    },
    {
      question: "What unbelievable price did the most expensive Shiba Inu sell for?",
      answer: "In 2016, a rare cream-colored Shiba Inu puppy sold for over $280,000 in China, making it one of the most expensive dog sales ever recorded!"
    },
    {
      question: "What unique vocal characteristic do Shiba Inus have?",
      answer: "Shiba Inus are known for making a unique 'Shiba scream' - a high-pitched vocal sound they make when excited, unhappy, or surprised that sounds remarkably like human screaming!"
    },
    {
      question: "What surprising historical role did Shiba Inus play in ancient Japan?",
      answer: "Shiba Inus were originally bred as hunting dogs in mountainous regions of Japan, skilled at flushing out small game and even wild boar despite their relatively small size!"
    },
    {
      question: "What unusual color variation exists in Shiba Inus that many don't know about?",
      answer: "While rare, some Shiba Inus are born with a unique 'cream' or 'white' coat color called 'urajiro', which was historically considered sacred in Japanese culture!"
    },
    {
      question: "What extraordinary sense do Shiba Inus possess?",
      answer: "Shiba Inus have an incredibly acute sense of direction, with many reported cases of them finding their way home from miles away, even in unfamiliar territory!"
    },
    {
      question: "What unique personality trait earned Shiba Inus a special nickname?",
      answer: "Shiba Inus are often called the 'Drama Queens' of the dog world due to their theatrical reactions and expressions, especially when they don't get their way!"
    },
    {
      question: "What surprising weather adaptation do Shiba Inus have?",
      answer: "Shiba Inus have a special double coat that's naturally water-repellent and can withstand extreme temperatures from -20°F to 120°F (-29°C to 49°C)!"
    },
    {
      question: "What unique hunting technique sets Shiba Inus apart?",
      answer: "Shiba Inus use a distinctive 'pouncing' technique when hunting, similar to foxes, where they jump high and dive nose-first into snow or tall grass to catch prey!"
    },
    {
      question: "What unexpected skill makes Shiba Inus excellent in emergencies?",
      answer: "Shiba Inus have been known to alert their owners to earthquakes before they happen, sensing the subtle vibrations that humans can't detect!"
    },
    {
      question: "What bizarre sleeping habit do Shiba Inus have?",
      answer: "Many Shiba Inus sleep on their backs with all four legs in the air, a position called the 'Shiba 500' that shows their complete trust in their environment!"
    },
    {
      question: "What surprising athletic record does a Shiba Inu hold?",
      answer: "A Shiba Inu named Mojo holds the record for the fastest dog to pop 100 balloons, completing the task in just 39.08 seconds!"
    },
    {
      question: "What unique cultural significance do Shiba Inus have in Japan?",
      answer: "Shiba Inus are considered a national treasure in Japan and are protected by the Nihon Ken Hozonkai organization, which preserves Japanese dog breeds!"
    },
    {
      question: "What unexpected talent do many Shiba Inus possess?",
      answer: "Many Shiba Inus show an uncanny ability to solve puzzle toys and food dispensers, with some even learning to open doors and refrigerators!"
    },
    {
      question: "What strange genetic anomaly can occur in Shiba Inus?",
      answer: "Some Shiba Inus possess a rare genetic trait called 'long coat,' producing fur twice the normal length, though this isn't recognized as breed standard!"
    },
    {
      question: "What unique social media achievement involves a Shiba Inu?",
      answer: "A Shiba Inu named Kabosu became one of the most famous dogs in internet history as the face of the 'Doge' meme, later inspiring the cryptocurrency Dogecoin!"
    },
    {
      question: "What surprising rescue ability do Shiba Inus have?",
      answer: "Shiba Inus have been successfully trained as search and rescue dogs, using their keen sense of smell and agility to navigate difficult mountain terrain!"
    },
    {
      question: "What unique dental characteristic do Shiba Inus possess?",
      answer: "Shiba Inus often retain their puppy teeth longer than other breeds, sometimes having two rows of teeth temporarily, earning them the nickname 'shark mouth'!"
    },
    {
      question: "What unexpected farming role did Shiba Inus historically play?",
      answer: "In ancient Japan, Shiba Inus were used to protect rice fields from birds, using their agility and intelligence to chase away crop-destroying pests!"
    },
    {
      question: "What strange phenomenon affects many Shiba Inus twice a year?",
      answer: "Shiba Inus undergo an extreme molting process called 'blowing coat' twice yearly, where they shed their entire undercoat in just a few days!"
    },
    {
      question: "What unique architectural feature exists for Shiba Inus in Japan?",
      answer: "Some Japanese homes feature special 'Shiba windows' - low windows at dog height that allow Shiba Inus to watch the street while staying safely indoors!"
    },
    {
      question: "What surprising longevity record does a Shiba Inu hold?",
      answer: "The oldest documented Shiba Inu lived to be 26 years old, making it one of the longest-living dogs ever recorded!"
    },
    {
      question: "What unique marking do all purebred Shiba Inus share?",
      answer: "All purebred Shiba Inus have a special spiral pattern in their tail fur, visible when the tail is viewed from the end, called a 'fish-scale pattern'!"
    },
    {
      question: "What unexpected swimming ability do Shiba Inus possess?",
      answer: "Despite their cat-like nature, Shiba Inus are naturally excellent swimmers, with some even participating in dock diving competitions!"
    },
    {
      question: "What unique seasonal change occurs in Shiba Inus?",
      answer: "Shiba Inus' coat colors can change dramatically with the seasons, becoming brighter in winter and more muted in summer, a trait called seasonal color variation!"
    },
    {
      question: "What surprising military role did Shiba Inus have?",
      answer: "During the Russo-Japanese War, Shiba Inus were used as messenger dogs, carrying vital communications through mountainous terrain!"
    },
    {
      question: "What unique breeding restriction exists for Shiba Inus in Japan?",
      answer: "In Japan, breeding Shiba Inus requires a special license, and each puppy must be inspected by the Japanese Kennel Club to maintain breed purity!"
    },
    {
      question: "What unexpected artistic tribute features Shiba Inus?",
      answer: "Ancient Japanese woodblock prints from the Edo period often featured Shiba Inus, making them one of the earliest dog breeds documented in art!"
    },
    {
      question: "What strange superstition involves Shiba Inus in Japanese culture?",
      answer: "In some parts of Japan, it's believed that a Shiba Inu's counter-clockwise tail curl brings good luck, while a clockwise curl warns of coming challenges!"
    },
    {
      question: "What unique television achievement involves a Shiba Inu?",
      answer: "A Shiba Inu named Mari starred in a Japanese drama series 'Mari and Her Three Puppies', based on a true story of surviving a major earthquake!"
    },
    {
      question: "What surprising medical detection ability do some Shiba Inus have?",
      answer: "Some Shiba Inus have been trained to detect early signs of cancer through scent, with accuracy rates comparable to specialized medical equipment!"
    },
    {
      question: "What unique gardening behavior do Shiba Inus exhibit?",
      answer: "Many Shiba Inus instinctively avoid stepping on plants and garden beds, a trait believed to come from their historical role in protecting crops!"
    },
    {
      question: "What unexpected weather prediction ability do Shiba Inus show?",
      answer: "Many Shiba owners report their dogs can predict incoming storms hours before they arrive, showing distinct behavioral changes as barometric pressure drops!"
    },
    {
      question: "What unique genetic advantage gives Shiba Inus excellent night vision?",
      answer: "Shiba Inus have a special reflective layer in their eyes called tapetum lucidum that's more developed than in most dogs, giving them superior night vision!"
    },
    {
      question: "What surprising diplomatic role did Shiba Inus play?",
      answer: "In the 1950s, Shiba Inus were given as diplomatic gifts from Japan to other nations, helping establish the breed internationally!"
    },
    {
      question: "What unique cognitive ability do Shiba Inus demonstrate?",
      answer: "Studies have shown Shiba Inus can recognize and remember human faces for years, even after brief encounters, showing remarkable long-term memory!"
    },
    {
      question: "What strange hibernation-like behavior do some Shiba Inus exhibit?",
      answer: "During extremely cold weather, some Shiba Inus enter a state of reduced activity called 'winter rest,' sleeping up to 20 hours a day while maintaining normal health!"
    },
    {
      question: "What unique postal service involves Shiba Inus in Japan?",
      answer: "In some rural Japanese towns, Shiba Inus participate in a special mail delivery service, carrying packages to elderly residents in mountainous areas!"
    },
    {
      question: "What surprising archaeological discovery involves Shiba Inus?",
      answer: "Archaeological digs in Japan have uncovered Shiba Inu remains dating back over 9,000 years, making them one of the oldest documented dog breeds!"
    },
    {
      question: "What unique adaptation helps Shiba Inus survive in mountains?",
      answer: "Shiba Inus have specially adapted paw pads that can temporarily harden in cold conditions, allowing them to walk on snow and ice without discomfort!"
    },
    {
      question: "What unexpected healing ability do Shiba Inus possess?",
      answer: "Shiba Inus have remarkably fast healing abilities, with wounds and injuries typically healing 20-30% faster than in other dog breeds!"
    },
    {
      question: "What strange magnetic sensitivity do Shiba Inus demonstrate?",
      answer: "Research suggests Shiba Inus can sense Earth's magnetic field and prefer to align themselves north-south when relieving themselves!"
    },
    {
      question: "What unique festival celebrates Shiba Inus in Japan?",
      answer: "The annual Shiba Inu Festival in Tokyo draws thousands of visitors, featuring Shiba fashion shows, agility contests, and historical reenactments!"
    },
    {
      question: "What surprising space connection does a Shiba Inu have?",
      answer: "A Shiba Inu's pawprint was sent to Mars on NASA's Perseverance rover as part of a global signature collection, making it the first dog breed represented on Mars!"
    },
    {
      question: "What unique mathematical pattern appears in Shiba Inu fur?",
      answer: "The spiral pattern in a Shiba Inu's tail fur follows the Fibonacci sequence, a mathematical pattern found in nature that creates perfect spirals!"
    },
    {
      question: "What unexpected world record does a Shiba Inu hold?",
      answer: "A Shiba Inu named Yuki holds the world record for the most tricks performed in one minute, completing 28 distinct commands in 60 seconds!"
    },
    {
      question: "What strange evolutionary advantage do Shiba Inus have?",
      answer: "Shiba Inus have unusually flexible spines that allow them to turn their bodies 180 degrees while running, a trait that helped them hunt in dense mountain forests!"
    },
    {
      question: "What unique contribution did Shiba Inus make to modern dog training?",
      answer: "The 'Shiba shake-off' method of stress relief was first observed in Shiba Inus and is now taught as a calming technique for all dog breeds!"
    },
    {
      question: "What surprising economic impact have Shiba Inus had?",
      answer: "The 'Shiba Inu effect' in Japan refers to the breed's influence on the pet industry, generating over $2.5 billion annually in related products and services!"
    }
  ];

  const words = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me"
  ];

  // Add function to find safe position
  const findSafePosition = () => {
    const gameWidth = 300; // Width of game container + some padding
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const possiblePosition = Math.random() * (screenWidth - gameWidth);

    // Check if this position overlaps with any existing games
    const isSafe = !usedPositions.some(pos => 
      Math.abs(pos - possiblePosition) < gameWidth
    );

    return isSafe ? possiblePosition : findSafePosition();
  };

  // Add function to check if game has hit bottom
  const checkBottomCollision = (gameId) => {
    const element = document.getElementById(`game-${gameId}`);
    if (element) {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (rect.bottom >= windowHeight) {
        handleGameDeath(gameId);
      }
    }
  };

  // Add function to handle game death
  const handleGameDeath = (gameId) => {
    playDeathSound(); // Add death sound when hitting bottom
    setNumberOfDeaths(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setIsGameOver(true);
        return 5; // Cap at 5
      }
      return newCount;
    });
    handleGameComplete(gameId);
  };

  // Modify initial game spawn to use random question
  useEffect(() => {
    if (completedQuestions.length === questions.length) {
      setIsGameOver(true);
      return;
    }

    // Start first game immediately
    if (gameCounter === 0 && activeGames.length === 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      const firstPosition = findSafePosition();
      setUsedPositions([firstPosition]);
      const firstGame = {
        id: generateUniqueId(),
        question: questions[randomIndex],
        startPosition: firstPosition,
        fallDuration: 60000,
        isFirst: true,
        questionIndex: randomIndex,
        initialLives: calculateInitialLives(questions[randomIndex].answer.split(" ").length)
      };
      setActiveGames([firstGame]);
      setGameCounter(1);
      setCompletedQuestions([]);
    }

    const addGameInterval = setInterval(() => {
      if (completedQuestions.length < questions.length) {
        if (activeGames.length < 2) {
          // Check if we're already creating this question
          const availableQuestions = questions.filter(q => 
            !completedQuestions.includes(q) && 
            !activeGames.some(game => game.question === q) &&
            q !== questions[0]
          );

          if (availableQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            const newQuestion = availableQuestions[randomIndex];
            const newPosition = findSafePosition();
            
            setActiveGames(prev => {
              // Double check we're not already creating this game
              if (prev.some(game => game.question === newQuestion)) {
                return prev;
              }

              const calculatedLives = calculateInitialLives(newQuestion.answer.split(" ").length);
              const newGame = {
                id: generateUniqueId(),
                question: newQuestion,
                startPosition: newPosition,
                fallDuration: 60000,
                questionIndex: questions.indexOf(newQuestion),
                initialLives: calculatedLives
              };
              
              return [...prev, newGame];
            });
            setGameCounter(prev => prev + 1);
          }
        }
      }
    }, 5000);

    return () => clearInterval(addGameInterval);
  }, [gameCounter, activeGames.length, completedQuestions.length]);

  // Add collision detection interval
  useEffect(() => {
    if (isGameOver) return;

    const collisionInterval = setInterval(() => {
      activeGames.forEach(game => {
        checkBottomCollision(game.id);
      });
    }, 100); // Check every 100ms

    return () => clearInterval(collisionInterval);
  }, [activeGames, isGameOver]);

  // Modify handleGameComplete to include the selection of next game
  const handleGameComplete = (gameId) => {
    setActiveGames(prev => {
      const completedGame = prev.find(game => game.id === gameId);
      if (completedGame) {
        setCompletedQuestions(prev => {
          const newCompleted = [...prev, completedGame.question];
          if (newCompleted.length === questions.length && numberOfDeaths < 5) {
            setIsGameOver(true);
          }
          return newCompleted;
        });
        setUsedPositions(positions => 
          positions.filter(pos => pos !== completedGame.startPosition)
        );
      }

      // Remove the completed game
      const newGames = prev.filter(game => game.id !== gameId);

      // If we've hit death limit, clear all games
      if (numberOfDeaths >= 5) {
        return [];
      }

      // Immediately create a new game if we're below the limit and have available questions
      if (newGames.length === 0 && completedQuestions.length < questions.length - 1) {
        const availableQuestions = questions.filter(q => 
          !completedQuestions.includes(q) && 
          !newGames.some(game => game.question === q)
        );

        if (availableQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableQuestions.length);
          const newQuestion = availableQuestions[randomIndex];
          const newPosition = findSafePosition();
          
          // Immediately add new game
          const newGame = {
            id: generateUniqueId(),
            question: newQuestion,
            startPosition: newPosition,
            fallDuration: 60000,
            questionIndex: questions.indexOf(newQuestion),
            initialLives: calculateInitialLives(newQuestion.answer.split(" ").length)
          };
          
          // Set selected game ID to the new game
          setSelectedGameId(newGame.id);
          
          return [newGame];
        }
      }

      // Select next available game if there are any
      if (newGames.length > 0) {
        setSelectedGameId(newGames[0].id);
      }

      return newGames;
    });
  };

  // Check for game over whenever deaths change
  useEffect(() => {
    if (numberOfDeaths >= 5) {
      setIsGameOver(true);
    }
  }, [numberOfDeaths]);

  // Update the game container to handle cursor proximity
  useEffect(() => {
    const handleMouseMove = (e) => {
      // If already hovering a game, don't change selection
      const hoveredGame = activeGames.find(game => {
        const element = document.getElementById(`game-${game.id}`);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        );
      });

      if (hoveredGame) {
        setSelectedGameId(hoveredGame.id);
        return;
      }

      // If no direct hover and no current selection, find closest game
      if (!selectedGameId) {
        let closestGame = null;
        let closestDistance = Infinity;

        activeGames.forEach(game => {
          const element = document.getElementById(`game-${game.id}`);
          if (!element) return;
          
          const rect = element.getBoundingClientRect();
          const distance = getDistanceFromCursor(rect, e.clientX, e.clientY);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestGame = game;
          }
        });

        if (closestGame) {
          setSelectedGameId(closestGame.id);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeGames, selectedGameId]);

  // Add effect to clear selection when game is removed
  useEffect(() => {
    if (selectedGameId && !activeGames.some(game => game.id === selectedGameId)) {
      setSelectedGameId(null);
    }
  }, [activeGames, selectedGameId]);

  // Add this effect near your other useEffects
  useEffect(() => {
    if (!hasGameStarted) {
      const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
          setHasGameStarted(true);
        }
      };

      window.addEventListener('keypress', handleKeyPress);
      return () => window.removeEventListener('keypress', handleKeyPress);
    }
  }, [hasGameStarted]);

  // Add this effect to handle the game over sound
  useEffect(() => {
    if (isGameOver && !gameOverSound) {
      const sound = playBonkLoop();
      sound.play().catch(e => console.log('Audio play failed:', e));
      setGameOverSound(sound);
    }

    // Cleanup function to stop the sound when component unmounts
    return () => {
      if (gameOverSound) {
        gameOverSound.pause();
        gameOverSound.currentTime = 0;
      }
    };
  }, [isGameOver]);

  return (
    <>
      <Head>
        <title>Doge Bonk Game</title>
        <meta name="description" content="you become a doge LLM. embrace the chaos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style>{fallingKeyframes}</style>
      </Head>
      {!hasGameStarted ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          color: '#FFAA00',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '600px', marginBottom: '40px' }}>
            <div style={{ marginBottom: '40px' }}>
              <Image
                src="/doge-fighter.gif"
                alt="Doge Fighter"
                width={250}
                height={200}
                style={{
                  imageRendering: 'pixelated',
                }}
              />
            </div>
            <RainbowText text="Welcome to Doge LLM!" />
            <p style={{ fontSize: '18px', lineHeight: '1.5', marginBottom: '20px', color: '#FFFFFF' }}>
              You are DOGE LLM and "users" will come to you with questions.
              Your task is to pick the most logical next word in your response to form coherent sentences.
            </p>
            <p style={{ fontSize: '18px', lineHeight: '1.5', marginBottom: '20px', color: '#FFFFFF' }}>
              Use number keys 1-3 or click to select words.
              Complete answers before they reach the bottom!
            </p>
          </div>
          <div>
            <button 
              onClick={() => setHasGameStarted(true)}
              style={{
                padding: '12px 24px',
                fontSize: '24px',
                backgroundColor: '#00AA00',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.1s ease',
                fontFamily: 'Minecraft',
                ':hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              Start Game
            </button>
            <p style={{ 
              fontSize: '14px', 
              color: '#FFFFFF', 
              marginTop: '10px',
              opacity: 0.8 
            }}>
              Press Enter to start
            </p>
          </div>
        </div>
      ) : (
        <>
          {!isGameOver && (
            <div style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              fontSize: '24px',
              color: '#FFAA00',
              zIndex: 1000,
              textShadow: '2px 2px #000000'
            }}>
              Deaths: {numberOfDeaths}/5
            </div>
          )}
          <div style={{ 
            position: 'relative',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: isGameOver ? '#000000' : 'transparent',
            transition: 'background-color 0.3s ease'
          }}>
            {isGameOver ? (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '32px',
                color: '#FFAA00',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '40px' }}>
                  <Image
                    src="/bonk2.gif"
                    alt="Doge Bonk"
                    width={400}
                    height={200}
                    style={{
                      imageRendering: 'pixelated',
                    }}
                  />
                </div>
                <div>Game Over!</div>
                <div style={{ fontSize: '24px', marginTop: '20px' }}>
                  Deaths: {numberOfDeaths}/5
                </div>
                <button
                  onClick={() => {
                    if (gameOverSound) {
                      gameOverSound.pause();
                      gameOverSound.currentTime = 0;
                    }
                    setGameOverSound(null);
                    setIsGameOver(false);
                    setNumberOfDeaths(0);
                    setCompletedQuestions([]);
                    setActiveGames([]);
                    setGameCounter(0);
                  }}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    fontSize: '20px',
                    backgroundColor: '#00AA00',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              activeGames.map((game) => (
                <div
                  key={game.id}
                  style={{
                    position: 'absolute',
                    left: game.startPosition,
                    top: game.isFirst ? '20px' : '-100%',
                    animation: `falling ${game.fallDuration}ms linear`,
                    animationFillMode: 'forwards',
                    zIndex: selectedGameId === game.id ? 10 : 1
                  }}
                >
                  <WordGame 
                    question={game.question.question}
                    answer={game.question.answer}
                    words={words}
                    onComplete={() => handleGameComplete(game.id)}
                    onTimeout={() => handleGameComplete(game.id)}
                    initialLives={game.initialLives}
                    gameId={game.id}
                    isSelected={selectedGameId === game.id}
                    onSelect={() => setSelectedGameId(game.id)}
                    numberOfDeaths={numberOfDeaths}
                    setNumberOfDeaths={setNumberOfDeaths}
                  />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
