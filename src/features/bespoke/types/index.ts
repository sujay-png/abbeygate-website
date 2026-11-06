export interface FeatureBullet {
  title: string;
  description: string;
}

export interface BespokeFeature {
  id: string;
  kicker: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  paragraphs: string[];
  optionsTitle?: string;
  bullets?: FeatureBullet[];
  afterText?: string;
  isFlipped?: boolean;
}

export interface JumpBarItem {
  id: string;
  label: string;
  href: string;
}

export interface BespokePageData {
  title: string;
  intro: string;
  jumpItems: JumpBarItem[];
  features: BespokeFeature[];
}

