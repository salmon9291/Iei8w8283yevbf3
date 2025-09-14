# Overview

This is a full-stack AI chat application built with React and Express. The application provides an interactive chat interface where users can communicate with an AI assistant powered by the Gemini API. The system includes user authentication, message persistence, voice controls with speech recognition and text-to-speech, and URL content extraction capabilities. The application is designed as a Spanish-language AI assistant that can read and analyze web content shared by users.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints for authentication, messaging, and user management
- **File Storage**: JSON file-based storage system using memory maps for development/demo purposes
- **Session Management**: Express sessions for authentication state

## Data Storage
- **Development Storage**: File-based JSON storage in `/data` directory
- **Schema Definition**: Drizzle ORM schemas defined for PostgreSQL (configured but not actively used)
- **Data Models**: Users and messages with TypeScript interfaces and Zod validation schemas
- **Memory Management**: In-memory maps with file persistence for fast access and durability

## Authentication & Authorization
- **Strategy**: Session-based authentication with username/password
- **Registration**: User registration with unique username validation
- **Session Storage**: Local storage for client-side session persistence
- **Route Protection**: Authentication modal guards protecting the main chat interface

## External Service Integrations
- **AI Provider**: Google Gemini API for natural language processing and conversation
- **Voice Services**: Web Speech API for speech recognition and synthesis
- **Content Extraction**: Built-in URL content fetching and parsing for web link analysis
- **Development Tools**: Replit integration with development banner and cartographer plugin

## Key Features
- **Multilingual AI**: Spanish-language AI assistant with customizable prompts
- **Voice Interface**: Speech-to-text input and text-to-speech output
- **URL Analysis**: Automatic content extraction and analysis from shared web links
- **Real-time Chat**: Instant messaging with typing indicators and message persistence
- **Theme Support**: Light/dark mode toggle with system preference detection
- **Responsive Design**: Mobile-first responsive interface using Tailwind breakpoints
- **Message Management**: Chat history persistence and clearing functionality

# External Dependencies

## Core Framework Dependencies
- **React**: Frontend framework with hooks and modern patterns
- **Express**: Backend web framework for Node.js
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Build tool and development server with HMR

## Database & ORM
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **@neondatabase/serverless**: PostgreSQL database driver for serverless environments

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible UI primitives
- **Shadcn/ui**: Pre-built component library based on Radix UI
- **Lucide React**: Icon library for consistent iconography

## State Management & Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and parsing

## AI & External APIs
- **Google Gemini API**: AI language model for chat responses
- **Web Speech API**: Browser-native speech recognition and synthesis

## Development & Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TSX**: TypeScript execution for development server

## Replit-Specific Tools
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development debugging tool