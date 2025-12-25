/**
 * Mock User Data for Testing
 *
 * This file contains mock user data for various test scenarios
 * including authentication, profile management, and matching.
 */

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  age: number;
  bio: string;
  gender: string;
  preferences: {
    minAge: number;
    maxAge: number;
    gender: string[];
    distance: number;
  };
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  verified: boolean;
  createdAt: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

// Valid test users
export const validUser: User = {
  id: 1,
  email: 'test@example.com',
  password: 'Password123!',
  name: 'John Doe',
  age: 28,
  bio: 'Love hiking and trying new restaurants',
  gender: 'male',
  preferences: {
    minAge: 25,
    maxAge: 35,
    gender: ['female'],
    distance: 50
  },
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg'
  ],
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA'
  },
  verified: true,
  createdAt: '2024-01-15T10:00:00Z'
};

export const validUser2: User = {
  id: 2,
  email: 'jane@example.com',
  password: 'SecurePass456!',
  name: 'Jane Smith',
  age: 26,
  bio: 'Coffee enthusiast and bookworm',
  gender: 'female',
  preferences: {
    minAge: 25,
    maxAge: 32,
    gender: ['male'],
    distance: 30
  },
  photos: [
    'https://example.com/jane1.jpg',
    'https://example.com/jane2.jpg'
  ],
  location: {
    latitude: 40.7580,
    longitude: -73.9855,
    city: 'New York',
    country: 'USA'
  },
  verified: true,
  createdAt: '2024-02-10T14:30:00Z'
};

export const unverifiedUser: User = {
  id: 3,
  email: 'unverified@example.com',
  password: 'TestPass789!',
  name: 'Bob Johnson',
  age: 30,
  bio: 'New to the app',
  gender: 'male',
  preferences: {
    minAge: 22,
    maxAge: 35,
    gender: ['female', 'non-binary'],
    distance: 25
  },
  photos: [],
  location: {
    latitude: 40.7489,
    longitude: -73.9680,
    city: 'New York',
    country: 'USA'
  },
  verified: false,
  createdAt: '2024-12-01T09:00:00Z'
};

// Credentials for easy access
export const validCredentials: UserCredentials = {
  email: validUser.email,
  password: validUser.password
};

export const validCredentials2: UserCredentials = {
  email: validUser2.email,
  password: validUser2.password
};

export const invalidCredentials: UserCredentials = {
  email: 'invalid@example.com',
  password: 'WrongPassword123!'
};

// Registration data
export interface RegistrationData {
  email: string;
  password: string;
  passwordConfirmation: string;
  name: string;
  age: number;
  gender: string;
  termsAccepted: boolean;
}

export const validRegistration: RegistrationData = {
  email: 'newuser@example.com',
  password: 'NewPass123!',
  passwordConfirmation: 'NewPass123!',
  name: 'Alice Williams',
  age: 27,
  gender: 'female',
  termsAccepted: true
};

export const invalidRegistrations = {
  missingEmail: {
    email: '',
    password: 'ValidPass123!',
    passwordConfirmation: 'ValidPass123!',
    name: 'Test User',
    age: 25,
    gender: 'female',
    termsAccepted: true
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'ValidPass123!',
    passwordConfirmation: 'ValidPass123!',
    name: 'Test User',
    age: 25,
    gender: 'female',
    termsAccepted: true
  },
  weakPassword: {
    email: 'test@example.com',
    password: '123',
    passwordConfirmation: '123',
    name: 'Test User',
    age: 25,
    gender: 'female',
    termsAccepted: true
  },
  passwordMismatch: {
    email: 'test@example.com',
    password: 'ValidPass123!',
    passwordConfirmation: 'DifferentPass456!',
    name: 'Test User',
    age: 25,
    gender: 'female',
    termsAccepted: true
  },
  underAge: {
    email: 'test@example.com',
    password: 'ValidPass123!',
    passwordConfirmation: 'ValidPass123!',
    name: 'Test User',
    age: 16,
    gender: 'female',
    termsAccepted: true
  },
  termsNotAccepted: {
    email: 'test@example.com',
    password: 'ValidPass123!',
    passwordConfirmation: 'ValidPass123!',
    name: 'Test User',
    age: 25,
    gender: 'female',
    termsAccepted: false
  }
};

// Profile update data
export const profileUpdateData = {
  valid: {
    name: 'John Updated Doe',
    bio: 'Updated bio with new interests',
    age: 29,
    preferences: {
      minAge: 26,
      maxAge: 36,
      gender: ['female', 'non-binary'],
      distance: 75
    }
  },
  invalid: {
    name: '', // Empty name
    bio: 'Valid bio',
    age: 15, // Underage
    preferences: {
      minAge: 40,
      maxAge: 30, // Invalid range
      gender: [],
      distance: -10 // Invalid distance
    }
  }
};

// Export all users as array for iteration
export const allUsers: User[] = [validUser, validUser2, unverifiedUser];
