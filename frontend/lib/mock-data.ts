/**
 * This file provides fixed demo content for development and testing purposes.
 * It will be used when the backend is unavailable or when USE_DEMO_CONTENT is enabled.
 */

// Demo summary content in Notion-style markdown format
export const demoSummaryContent = `# Study Notes: Machine Learning Fundamentals

## Key Concepts

- **Machine Learning**: A branch of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.
- **Supervised Learning**: Training models using labeled data, where the correct output is provided.
- **Unsupervised Learning**: Finding patterns in data without labeled outputs.
- **Reinforcement Learning**: Learning through interactions with an environment to maximize rewards.

## Core Algorithms

### Regression
- **Linear Regression**: Models relationships between variables using a linear equation.
- **Polynomial Regression**: Extends linear regression to capture non-linear relationships.

### Classification
- **Logistic Regression**: Used for binary classification problems.
- **Decision Trees**: Tree-like models for both classification and regression.
- **Random Forests**: Ensemble method that builds multiple decision trees.

### Clustering
- **K-means**: Partitions data into k clusters based on similarity.
- **Hierarchical Clustering**: Creates a tree of clusters without requiring a pre-specified number.

## Model Evaluation
- **Accuracy, Precision, Recall, F1-Score**: Metrics for classification performance.
- **Mean Squared Error, R-squared**: Metrics for regression performance.
- **Cross-validation**: Technique to assess how a model generalizes to independent data.

## Neural Networks
- **Perceptron**: The simplest form of neural network, a binary classifier.
- **Multilayer Perceptron**: Networks with one or more hidden layers.
- **Convolutional Neural Networks (CNNs)**: Specialized for processing grid-like data, such as images.
- **Recurrent Neural Networks (RNNs)**: Designed for sequential data and time series.

## Practical Considerations
- **Feature Engineering**: The process of selecting and transforming variables.
- **Overfitting vs. Underfitting**: Balance between model complexity and generalization.
- **Hyperparameter Tuning**: Optimizing model parameters that are not learned during training.
- **Bias-Variance Tradeoff**: Finding the sweet spot between model simplicity and flexibility.`;

// Demo condensed summary for the condensed version
export const demoCondensedSummaryContent = `# Condensed: Machine Learning Fundamentals

## Core Concepts
- **Machine Learning**: AI systems that learn from experience without explicit programming
- **Learning Types**: 
  - Supervised: Uses labeled data
  - Unsupervised: Finds patterns in unlabeled data
  - Reinforcement: Learns through environment interactions

## Key Algorithms
- **Regression**: Linear & polynomial models for relationships between variables
- **Classification**: Logistic regression, decision trees, random forests
- **Clustering**: K-means, hierarchical clustering

## Neural Networks
- **Types**: Perceptron, MLP, CNN (for images), RNN (for sequences)

## Best Practices
- **Evaluation**: Use accuracy, precision, recall, MSE, cross-validation
- **Optimization**: Feature engineering, prevent overfitting, tune hyperparameters, balance bias-variance`;

// Demo flashcards
export const demoFlashcards = [
  {
    id: "fc1",
    front: "What is Machine Learning?",
    back: "A branch of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed."
  },
  {
    id: "fc2",
    front: "Describe Supervised Learning",
    back: "Training models using labeled data, where the correct output is provided."
  },
  {
    id: "fc3",
    front: "What is Unsupervised Learning?",
    back: "Finding patterns in data without labeled outputs."
  },
  {
    id: "fc4",
    front: "Explain Reinforcement Learning",
    back: "Learning through interactions with an environment to maximize rewards."
  },
  {
    id: "fc5",
    front: "What is Linear Regression used for?",
    back: "Modeling relationships between variables using a linear equation."
  },
  {
    id: "fc6",
    front: "What are CNNs specialized for?",
    back: "Processing grid-like data, such as images."
  },
  {
    id: "fc7",
    front: "What is the Bias-Variance Tradeoff?",
    back: "Finding the sweet spot between model simplicity (high bias) and flexibility (high variance)."
  },
  {
    id: "fc8",
    front: "What is K-means clustering?",
    back: "An algorithm that partitions data into k clusters based on similarity."
  }
];

// Format flashcards as TSV (Tab Separated Values) for the flashcards page
export const demoFlashcardsTSV = demoFlashcards
  .map(card => `${card.front}\t${card.back}`)
  .join('\n');

// Mock API response for summary generation
export const mockSummaryResponse = {
  notionMarkdown: demoSummaryContent,
  stats: {
    generationTimeMs: 1243,
    inputTokens: 3456,
    outputTokens: 789,
    totalTokens: 4245
  }
};

// Mock API response for flashcard generation
export const mockFlashcardsResponse = {
  flashcards: demoFlashcardsTSV,
  stats: {
    generationTimeMs: 876,
    inputTokens: 2345,
    outputTokens: 456,
    totalTokens: 2801
  }
};

// Mock API response for summary condensation
export const mockCondensedSummaryResponse = {
  condensedSummary: demoCondensedSummaryContent,
  stats: {
    generationTimeMs: 653,
    inputTokens: 789,
    outputTokens: 234,
    totalTokens: 1023
  }
};

// Import the store to initialize demo data
import { useUploadStore } from '@/store/use-upload-store';

/**
 * Initialize the store with demo data for testing the UI
 * This ensures that when in demo mode, all pages will have data to display
 */
export function initDemoData() {
  const store = useUploadStore.getState();
  
  // Only initialize if we're in demo mode
  const isDemoMode = process.env.USE_DEMO_CONTENT === 'true' || 
                     (typeof window !== 'undefined' && window.localStorage.getItem('USE_DEMO_CONTENT') === 'true');
  
  if (isDemoMode) {
    console.log('🧪 Initializing store with demo data');
    
    // Reset any existing data first
    store.reset();
    
    // Set original summary and then condensed summary
    store.addSummary(demoSummaryContent);
    
    // Set demo flashcards
    store.setFlashcards(demoFlashcardsTSV);
  }
}