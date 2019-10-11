import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient} from '@angular/common/http';

import { AppComponent } from './app.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BalloonsComponent } from './balloons/balloons.component';

@NgModule({
  declarations: [
    AppComponent,
    BalloonsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ModalModule.forRoot()
  ],
  providers: [HttpClient],
  bootstrap: [AppComponent]
})
export class AppModule { }
