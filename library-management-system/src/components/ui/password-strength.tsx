'use client';

import { useState, useEffect } from 'react';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setFeedback('');
      return;
    }

    let score = 0;
    let feedbackText = '';

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedbackText = 'Password is too short';
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else if (!feedbackText) {
      feedbackText = 'Add uppercase letter';
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else if (!feedbackText) {
      feedbackText = 'Add lowercase letter';
    }

    // Number check
    if (/[0-9]/.test(password)) {
      score += 1;
    } else if (!feedbackText) {
      feedbackText = 'Add a number';
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else if (!feedbackText) {
      feedbackText = 'Add a special character';
    }

    // Set feedback based on overall strength
    if (score === 5 && !feedbackText) {
      feedbackText = 'Strong password';
    } else if (score >= 3 && !feedbackText) {
      feedbackText = 'Good password';
    } else if (!feedbackText) {
      feedbackText = 'Weak password';
    }

    setStrength(score);
    setFeedback(feedbackText);
  }, [password]);

  // Determine the right color for the strength indicator
  const getColor = (score: number): string => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Determine the appropriate text color for feedback
  const getTextColor = (score: number): string => {
    if (score <= 1) return 'text-red-500';
    if (score <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-1 w-full rounded-full ${
              index <= strength ? getColor(strength) : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${getTextColor(strength)}`}>{feedback}</p>
    </div>
  );
}
