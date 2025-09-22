import { Component, HostBinding, input, OnInit } from '@angular/core';
import { PaddingElement } from '@cccteam/ccc-lib/src/types';

@Component({
  selector: 'ccc-padding-element',
  imports: [],
  templateUrl: './padding-element.component.html',
  styleUrls: ['./padding-element.component.scss'],
})
export class PaddingElementComponent implements OnInit {
  paddingElement = input.required<PaddingElement>();

  @HostBinding('class') class = 'col-6';

  ngOnInit(): void {
    if (this.paddingElement().cols) {
      this.class = 'col-' + this.paddingElement()?.cols;
    }
  }
}
