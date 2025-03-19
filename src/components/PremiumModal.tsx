import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onSubscribe
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Upgrade to Premium</DialogTitle>
          <DialogDescription className="text-center">
            Unlock all premium K-drama episodes and enjoy ad-free viewing
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-center mb-4">Monthly Premium</h3>
              <p className="text-3xl font-bold text-center mb-6">¥980<span className="text-sm font-normal">/month</span></p>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Unlimited access to all episodes</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Ad-free viewing experience</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>New episodes weekly</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Japanese subtitles</span>
                </li>
              </ul>
              
              <Button 
                className="w-full" 
                onClick={onSubscribe}
              >
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="flex flex-col">
          <p className="text-xs text-center text-muted-foreground mb-2">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            You can cancel anytime.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;