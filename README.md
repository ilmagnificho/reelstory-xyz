# ReelStory - K-Drama Short Video Platform

A mobile-friendly platform for Japanese women to watch short-form Korean drama clips.

## Features

- Vertical video player with play/pause and mute controls
- Episode listing with free and premium content
- User authentication system
- Favorites functionality
- Premium subscription modal
- Responsive, mobile-first design with Japanese language elements
- Multi-language support (Japanese, English, Korean)

## Video Upload Guide

### How to Upload Videos to ReelStory

There are two ways to add videos to the platform:

#### 1. Using External Video URLs

For development and testing, you can use external video URLs:

1. Host your videos on a CDN or video hosting service (e.g., AWS S3, Cloudinary, etc.)
2. Get the direct URL to the video file
3. Add the video information to the database using Prisma:

```typescript
// Example of adding a new episode with Prisma
await prisma.episode.create({
  data: {
    title: "Episode Title",
    description: "Episode description",
    videoUrl: "https://your-cdn.com/video-url.mp4",
    thumbnailUrl: "https://your-cdn.com/thumbnail-url.jpg",
    isPremium: false,
    duration: 180, // in seconds
    drama: {
      connect: {
        id: "drama-id" // Connect to existing drama
      }
    }
  }
});
```

#### 2. For Production Use

For production, we recommend using a dedicated video hosting service:

1. Upload videos to a service like Cloudinary, AWS S3 + CloudFront, or a specialized video hosting platform
2. Ensure the videos are optimized for mobile viewing (different resolutions)
3. Update the database with the video URLs
4. Consider implementing server-side transcoding for optimal performance

## Development Notes

- The app is built with Next.js, TypeScript, Prisma, and Supabase
- Authentication is handled by Supabase
- The UI is built with shadcn/ui components and Tailwind CSS
- Japanese is the default language, with options for English and Korean

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Run the development server with `npm run dev`