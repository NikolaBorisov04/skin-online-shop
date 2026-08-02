import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Milestone {
  year: string;
  title: string;
  description: string;
}

export interface ValueItem {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'skin-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  readonly values: readonly ValueItem[] = [
    {
      number: '01',
      title: 'Autentična koža',
      description: 'Koristimo isključivo najkvalitetniju prirodnu kožu koja protokom vremena dobija karakterističnu i bogatu patinu.',
    },
    {
      number: '02',
      title: 'Zanatska preciznost',
      description: 'Svaki komad prolazi kroz šake iskusnih majstora koji decenijama usavršavaju tehniku ručne obrade i šivenja.',
    },
    {
      number: '03',
      title: 'Bezvremenski dizajn',
      description: 'Stvaramo oblike koji prevazilaze prolazne trendove — estetiku usmerenu na funkcionalnost i prefinjenost.',
    },
    {
      number: '04',
      title: 'Održiva estetika',
      description: 'Verujemo u manju potrošnju i više kvaliteta. Proizvodi napravljeni da traju generacijama, a ne sezonama.',
    },
  ];

  readonly milestones: readonly Milestone[] = [
    {
      year: '2012',
      title: 'Prva radionica',
      description: 'Započeli smo sa malim timom strastvenih zanatlija posvećenih ručnoj izradi kožne galanterije vrhunskog kvaliteta.',
    },
    {
      year: '2017',
      title: 'Ujedinjenje brendova',
      description: 'Okupili smo vodeće domaće radionice — Manual Co, Prince i Falco — pod jednu jedinstvenu viziju.',
    },
    {
      year: '2021',
      title: 'Digitalna transformacija',
      description: 'Lansirali smo prepoznatljivu e-commerce platformu kako bismo priču o kvalitetu približili kupcima širom sveta.',
    },
    {
      year: '2026',
      title: 'Skin Koncept',
      description: 'Danas Skin predstavlja sinonim za beskompromisan kvalitet, autentičnost i savremenu eleganciju.',
    },
  ];
}
