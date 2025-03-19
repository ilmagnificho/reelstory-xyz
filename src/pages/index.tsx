import React, { useEffect } from "react";
import Head from "next/head";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();

  // Automatically redirect to videos page for immediate viewing
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/videos');
    }, 1000); // Short delay to allow the page to render

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>ReelStory - K-drama Short Videos</title>
        <meta name="description" content="Watch short K-drama videos on ReelStory. Perfect for Japanese K-drama fans." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-background min-h-screen flex flex-col">
        <header className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            ReelStory
          </h1>
          <LanguageSelector />
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full mx-auto text-center">
            <div className="mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                ReelStory
              </h1>
              <p className="text-lg mt-2 text-muted-foreground">
                短編韓国ドラマビデオ
              </p>
            </div>
            
            <div className="relative w-full aspect-[9/16] mb-8 rounded-xl overflow-hidden shadow-xl">
              <Image 
                src="https://assets.co.dev/95da6205-c8dc-42ac-a273-7db27ca3519d/image-f513fef.png" 
                alt="K-drama preview" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <h2 className="text-white text-xl font-bold mb-2">Discover Korean Dramas</h2>
                <p className="text-white/90 mb-4">Short clips from your favorite K-dramas</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full text-lg py-6" 
                size="lg"
                onClick={() => router.push('/videos')}
              >
                {t('watchNow')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-lg py-6" 
                size="lg"
                onClick={() => router.push('/login')}
              >
                {t('alreadyHaveAccount')}
              </Button>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <h3 className="font-bold text-xl">100+</h3>
                <p className="text-sm text-muted-foreground">K-drama clips</p>
              </div>
              <div>
                <h3 className="font-bold text-xl">Free</h3>
                <p className="text-sm text-muted-foreground">To start</p>
              </div>
              <div>
                <h3 className="font-bold text-xl">日本語</h3>
                <p className="text-sm text-muted-foreground">Subtitles</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}