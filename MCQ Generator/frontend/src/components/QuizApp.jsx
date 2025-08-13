import React, { useEffect, useState } from "react";

const QuizApp = () => {
  const [mcqsData, setMcqsData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [visited, setVisited] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState(3600);

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/generate-mcqs")
      .then((response) => {
        if (!response.ok) {
          console.error(`Server responded with ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const mcqs = Array.isArray(data) ? data : [];
        setMcqsData(mcqs);
        setUserAnswers(Array(mcqs.length).fill(null));
        setVisited(Array(mcqs.length).fill(false));
        setLoading(false);

  
        if (mcqs.length > 0) {
          setVisited((prev) => {
            const updated = [...prev];
            updated[0] = true;
            return updated;
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching MCQs:", error);
        setLoading(false);
      });
  }, []);


  useEffect(() => {
    setVisited((prev) => {
      const updated = [...prev];
      updated[currentQuestionIndex] = true;
      return updated;
    });
  }, [currentQuestionIndex]);

  useEffect(() => {

    if (submitted) return;

    if (timeLeft <= 0) {
      handleSubmit(); 
      
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, submitted]);

  // Helper function to format time as mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Save user's answer
  const saveAnswer = (index, letter) => {
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[index] = letter;
      return updated;
    });
  };

  // Navigation: Prev/Next
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < mcqsData.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Submit quiz: Only calculate and display the total score.
  const handleSubmit = () => {
    let score = 0;
    mcqsData.forEach((mcq, index) => {
      if (userAnswers[index] === mcq.answer) {
        score++;
      }
    });
    setResult(
      <h3 className="font-bold">
        Your Score: {score} out of {mcqsData.length}
      </h3>
    );
    setSubmitted(true);
  };

  // Dynamic Tailwind classes for navigator buttons
  const getNavButtonClass = (i) => {
    const totalQuestions = mcqsData.length;
    let base = "font-bold rounded transition-transform duration-200 active:scale-95 ";

    // Adjust size dynamically based on total questions
    if (totalQuestions <= 10) {
      base += "w-10 h-10 text-base ";
    } else if (totalQuestions <= 20) {
      base += "w-9 h-9 text-sm ";
    } else if (totalQuestions <= 30) {
      base += "w-8 h-8 text-xs ";
    } else {
      base += "w-7 h-7 text-xs ";
    }

    // Not visited => white, visited but not answered => red, answered => green
    if (!visited[i]) {
      base += "bg-white text-gray-800 ";
    } else if (userAnswers[i]) {
      base += "bg-green-500 text-white ";
    } else {
      base += "bg-red-500 text-white ";
    }

    // Highlight the current question
    if (i === currentQuestionIndex) {
      base += "outline outline-2 outline-black ";
    }

    return base;
  };

  // If exam is submitted, only show the score.
  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#e0eafc] to-[#cfdef3] items-center justify-center">
        <h1 className="text-center p-4 bg-gray-800 text-white shadow-md mb-4">
          Exam Completed
        </h1>
        <div className="text-center text-xl font-bold p-4">{result}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#e0eafc] to-[#cfdef3]">
      <h1 className="text-center p-4 bg-gray-800 text-white shadow-md">
        MCQ Test
      </h1>

      {/* Timer Display */}
      <div className="text-center text-xl font-bold p-4">
        Time Left: {formatTime(timeLeft)}
      </div>

      <div className="flex flex-1 p-6 gap-8 flex-col md:flex-row">
        {/* Left: Quiz Section */}
        <div className="flex-1 bg-white rounded-lg p-4 shadow-md flex flex-col justify-between">
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
              </div>
            ) : mcqsData.length > 0 ? (
              <div className="mb-5 p-4 border border-gray-300 rounded bg-gray-50">
                <p className="mb-4 font-bold">
                  {currentQuestionIndex + 1}. {mcqsData[currentQuestionIndex].question}
                </p>
                {mcqsData[currentQuestionIndex].options.map((option, idx) => {
                  const letter = option.split(".")[0];
                  return (
                    <div className="ml-5 mb-2" key={idx}>
                      <input
                        type="radio"
                        name={`question${currentQuestionIndex}`}
                        id={`q${currentQuestionIndex}_${letter}`}
                        value={letter}
                        checked={userAnswers[currentQuestionIndex] === letter}
                        onChange={() => saveAnswer(currentQuestionIndex, letter)}
                        className="mr-2"
                      />
                      <label htmlFor={`q${currentQuestionIndex}_${letter}`}>
                        {option}
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No questions available.</p>
            )}
          </div>

          {/* Navigation Buttons: Previous and Next */}
          <div className="flex justify-between mt-5">
            <button
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-sm rounded bg-indigo-600 text-white transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-800"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === mcqsData.length - 1}
              className="px-4 py-2 text-sm rounded bg-indigo-600 text-white transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-800"
            >
              Next
            </button>
          </div>

          {/* Submit Button */}
          <div className="mt-4">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-base rounded bg-pink-600 text-white transition-colors duration-200 hover:bg-pink-700"
            >
              Submit Answers
            </button>
          </div>
        </div>

        {/* Right: Question Navigator (5 buttons per row, left-aligned) */}
        <div
          className="
            max-h-[75vh]
            overflow-y-auto
            bg-white
            rounded-lg
            p-4
            shadow-md
            grid
            grid-cols-5
            gap-2
            justify-items-start
            w-fit
          "
        >
          {mcqsData.map((_, i) => (
            <button
              key={i}
              className={getNavButtonClass(i)}
              onClick={() => setCurrentQuestionIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizApp;
