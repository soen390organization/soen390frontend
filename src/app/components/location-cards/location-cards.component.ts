import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-location-cards',
  imports: [CommonModule],
  templateUrl: './location-cards.component.html',
  styleUrls: ['./location-cards.component.scss'],
})
export class LocationCardsComponent  implements OnInit {

  locations = [
    {
    name: "Starbucks",
    address: "2000 Guy St",
    image: "assets/images/starbucks.jpg"
  },
  {
    name: "Tim Hortons",
    address: "2081 Guy St",
    image: "assets/images/tim-hortons.jpeg"
  },
  { name: "Poulet Rouge",
  address: "1623 Saint-Catherine St",
  image: "assets/images/poulet-rouge.png"
  },
  {
    name: "Starbucks",
    address: "2000 Guy St",
    image: "assets/images/starbucks.jpg"
  },
  {
    name: "Tim Hortons",
    address: "2081 Guy St",
    image: "assets/images/tim-hortons.jpeg"
  },
  { name: "Poulet Rouge",
  address: "1623 Saint-Catherine St",
  image: "assets/images/poulet-rouge.png"
  },
  {
    name: "Starbucks",
    address: "2000 Guy St",
    image: "assets/images/starbucks.jpg"
  },
  {
    name: "Tim Hortons",
    address: "2081 Guy St",
    image: "assets/images/tim-hortons.jpeg"
  },
  { name: "Poulet Rouge",
  address: "1623 Saint-Catherine St",
  image: "assets/images/poulet-rouge.png"
  },
  {
    name: "Starbucks",
    address: "2000 Guy St",
    image: "assets/images/starbucks.jpg"
  },
  {
    name: "Tim Hortons",
    address: "2081 Guy St",
    image: "assets/images/tim-hortons.jpeg"
  },
  { name: "Poulet Rouge",
  address: "1623 Saint-Catherine St",
  image: "assets/images/poulet-rouge.png"
  },


  ];

  constructor() { }

  ngOnInit() {}

}
