import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizRunnerProps {
  questions: QuizQuestion[];
  title: string;
  onComplete?: (score: number, total: number) => void;
}

export default function QuizRunner({ questions, title, onComplete }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    if (isCorrect) setScore(score + 1);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
      const finalScore = score + (selectedAnswer === currentQuestion.correctIndex ? 1 : 0);
      onComplete?.(finalScore, questions.length);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const finalScore = score + (selectedAnswer === currentQuestion.correctIndex ? 1 : 0);
    const percentage = Math.round((finalScore / questions.length) * 100);

    return (
      <div className="card p-[var(--spacing-xl)] text-center max-w-md mx-auto animate-scale-in">
        <h2 className="text-headline-2 mb-4">Quiz Complete!</h2>
        <p className="text-display text-[var(--color-accent-orange)] mb-2">{percentage}%</p>
        <p className="text-caption">
          You got {finalScore} out of {questions.length} correct
        </p>
        <button onClick={resetQuiz} className="btn-primary mt-6">
          Try Again
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p className="text-headline-3 text-[var(--color-text-secondary)]">No questions available</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-headline-3">{title}</h2>
        <span className="text-caption">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="card p-[var(--spacing-lg)] mb-6">
        <p className="text-headline-3 mb-6">{currentQuestion.question}</p>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let className = 'w-full p-[var(--spacing-md)] rounded-[var(--radius-md)] border-2 text-left transition-all ';

            if (showResult) {
              if (index === currentQuestion.correctIndex) {
                className += 'border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/10';
              } else if (index === selectedAnswer) {
                className += 'border-[var(--color-accent-red)] bg-[var(--color-accent-red)]/10';
              } else {
                className += 'border-[var(--color-surface-secondary)] opacity-50';
              }
            } else if (selectedAnswer === index) {
              className += 'border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]/10';
            } else {
              className += 'border-[var(--color-surface-secondary)] hover:border-[var(--color-accent-orange)]/50';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showResult}
                className={className}
              >
                <div className="flex items-center gap-[var(--spacing-sm)]">
                  <span className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center font-semibold text-body-small">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-body flex-1">{option}</span>
                  {showResult && index === currentQuestion.correctIndex && (
                    <CheckCircle className="text-[var(--color-accent-green)]" size={20} />
                  )}
                  {showResult && index === selectedAnswer && index !== currentQuestion.correctIndex && (
                    <XCircle className="text-[var(--color-accent-red)]" size={20} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && currentQuestion.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-[var(--spacing-md)] bg-[var(--color-accent-blue)]/10 rounded-[var(--radius-md)]"
          >
            <p className="text-body-small font-semibold text-[var(--color-accent-blue)] mb-1">
              Explanation
            </p>
            <p className="text-body-small text-[var(--color-text-secondary)]">
              {currentQuestion.explanation}
            </p>
          </motion.div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <button onClick={handleNext} className="btn-primary">
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}
