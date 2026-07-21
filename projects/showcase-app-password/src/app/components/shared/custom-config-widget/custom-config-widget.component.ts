import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { CustomConfigComponent } from '@cccteam/ccc-lib/types';

@Component({
  selector: 'app-custom-config-widget',
  imports: [JsonPipe],
  templateUrl: './custom-config-widget.component.html',
  styleUrl: './custom-config-widget.component.scss',
})
export class CustomConfigWidgetComponent extends CustomConfigComponent {}
