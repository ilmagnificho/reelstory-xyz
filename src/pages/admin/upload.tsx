import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Drama {
  id: string;
  title: string;
}

const UploadPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 60,
    isPremium: false,
    dramaId: '',
  });

  // Fetch dramas for the dropdown
  useEffect(() => {
    const fetchDramas = async () => {
      try {
        // This is a mock for development
        // In production, you would fetch from your API
        setDramas([
          { id: '1', title: 'Crash Landing on You' },
          { id: '2', title: 'Goblin' },
          { id: '3', title: 'Itaewon Class' },
        ]);
      } catch (error) {
        console.error('Error fetching dramas:', error);
      }
    };

    fetchDramas();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPremium: checked }));
  };

  const handleDramaChange = (value: string) => {
    setFormData(prev => ({ ...prev, dramaId: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // This is a mock for development
      // In production, you would submit to your API
      console.log('Submitting episode:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Episode added successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        duration: 60,
        isPremium: false,
        dramaId: '',
      });
    } catch (error) {
      console.error('Error adding episode:', error);
      alert('Failed to add episode');
    } finally {
      setIsLoading(false);
    }
  };

  // This is a development-only page
  return (
    <>
      <Head>
        <title>Admin - Upload Video</title>
      </Head>
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Episode</CardTitle>
            <CardDescription>
              Add a new K-drama episode to the platform
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Episode Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/video.mp4"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full URL to your video file
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/thumbnail.jpg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drama">Drama</Label>
                <Select
                  value={formData.dramaId}
                  onValueChange={handleDramaChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a drama" />
                  </SelectTrigger>
                  <SelectContent>
                    {dramas.map(drama => (
                      <SelectItem key={drama.id} value={drama.id}>
                        {drama.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPremium"
                  checked={formData.isPremium}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isPremium">Premium Content</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Uploading...' : 'Upload Episode'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
};

export default UploadPage;