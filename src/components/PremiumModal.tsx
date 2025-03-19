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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();
  
  // Language-specific content
  const content = {
    ja: {
      title: 'プレミアムにアップグレード',
      description: 'すべてのプレミアム韓国ドラマエピソードのロックを解除し、広告なしの視聴をお楽しみください',
      plan: '月額プレミアム',
      price: '¥980',
      perMonth: '/月',
      benefits: [
        'すべてのエピソードへの無制限アクセス',
        '広告なしの視聴体験',
        '毎週新しいエピソード',
        '日本語字幕',
      ],
      subscribe: '今すぐ登録',
      terms: '登録することにより、利用規約とプライバシーポリシーに同意したことになります。いつでもキャンセルできます。'
    },
    en: {
      title: 'Upgrade to Premium',
      description: 'Unlock all premium K-drama episodes and enjoy ad-free viewing',
      plan: 'Monthly Premium',
      price: '¥980',
      perMonth: '/month',
      benefits: [
        'Unlimited access to all episodes',
        'Ad-free viewing experience',
        'New episodes weekly',
        'Japanese subtitles',
      ],
      subscribe: 'Subscribe Now',
      terms: 'By subscribing, you agree to our Terms of Service and Privacy Policy. You can cancel anytime.'
    },
    ko: {
      title: '프리미엄으로 업그레이드',
      description: '모든 프리미엄 한국 드라마 에피소드를 잠금 해제하고 광고 없는 시청을 즐기세요',
      plan: '월간 프리미엄',
      price: '¥980',
      perMonth: '/월',
      benefits: [
        '모든 에피소드에 무제한 액세스',
        '광고 없는 시청 경험',
        '매주 새로운 에피소드',
        '일본어 자막',
      ],
      subscribe: '지금 구독하기',
      terms: '구독함으로써 서비스 약관 및 개인정보 보호정책에 동의하게 됩니다. 언제든지 취소할 수 있습니다.'
    }
  };
  
  const currentContent = content[language];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">{currentContent.title}</DialogTitle>
          <DialogDescription className="text-center">
            {currentContent.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-center mb-4">{currentContent.plan}</h3>
              <p className="text-3xl font-bold text-center mb-6">{currentContent.price}<span className="text-sm font-normal">{currentContent.perMonth}</span></p>
              
              <ul className="space-y-2 mb-6">
                {currentContent.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                onClick={onSubscribe}
              >
                {currentContent.subscribe}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="flex flex-col">
          <p className="text-xs text-center text-muted-foreground mb-2">
            {currentContent.terms}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;