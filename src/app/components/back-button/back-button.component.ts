import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss'],
  imports: [CommonModule]
})
export class BackButtonComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
