import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  public receiverName = '';
  public senderName = '';
  public greeting = '';
  public greetingType = 'HNY';

  public displayType = '';

  public greetingPlaceholder = '{{Default}}';

  // Default Values to be loaded
  private defaultReceiverName = 'You';
  private defaultSenderName = 'MakeMyGreeting';
  private defaultGreeting = {
    HNY:
      'May all your Dreams and Wishes come true, and may Success touch your feet. May each day of the New year bring you Luck, Joy, Happiness and Prosperity. Wishing you and your family a Happy New Year',
    HBD:
      'Hope your special day brings you all that your heart desires! Here’s wishing you a day full of pleasant surprises! Happy birthday!',
  };
  private defaultType = 'HNY';

  // Values for creating/previewing new greetings
  public newSender = '';
  public newReceiver = '';
  public newGreeting = '';
  public newGreetingType = 'HNY';

  // Flags
  public linkGenerated = false;
  public newLink = '';
  public whatsappMsg = '';
  public fbMsg = '';
  public isChrome = true;
  public isPreview = false;
  public songSrc = '';
  public showMessage = false;

  // Mode to create new Greeting Links
  public allowCreateLinks = true;

  // http Options for Post call
  public httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  @ViewChild('createModal') createModal: ModalDirective;

  constructor(private _http: HttpClient, private _sanitizer: DomSanitizer) {
    this.randomSong();
  }

  ngOnInit() {
    this.isChrome =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    this.getGreeting(this.getQueryParam('id'));
    this.newGreeting = this.defaultGreeting[this.defaultType];
    this.removeLogo();
  }
  
  public initializeDefault() {
    this.receiverName = this.defaultReceiverName;
    this.senderName = this.defaultSenderName;
    this.greeting = this.defaultGreeting[this.defaultType];
    this.displayType = this.defaultType;
    this.showMessage = true;
  }

  randomSong() {
    let i = parseInt(sessionStorage.getItem('key_songId'));
    i = Number.isInteger(i) ? (i + 1) % 5 : (Math.random() * 5) >> 0;
    this.songSrc = `assets/songs/${this.greetingType}/song${i}.mp3`;
    sessionStorage.setItem('key_songId', i.toString());
  }

  removeLogo() {
    setTimeout(() => {
      const aElt = document.querySelectorAll('a');
      for (let i = 0; i < aElt.length; i++) {
        if (aElt[i].title.includes('Hosted on free')) {
          aElt[i].remove();
          break;
        }
      }
    }, 100);
  }

  public capitilize(name: string): string {
    try {
      let nameArry = name.split(' ');
      nameArry = nameArry.map(x => x[0].toUpperCase() + x.substr(1));
      return nameArry.join(' ');
    } catch (e) {
      return name;
    }
  }

  public copyLink() {
    const input = document.createElement('input');
    input.setAttribute('value', this.newLink);
    document.body.appendChild(input);
    input.select();
    const result = document.execCommand('copy');
    document.body.removeChild(input);
    return result;
  }

  public getGreetingPlaceholder() {
    return this.isGreetingDefault()
      ? this.greetingPlaceholder
      : this.newGreeting;
  }

  public isGreetingDefault(): boolean {
    return this.newGreeting === this.defaultGreeting[this.newGreetingType];
  }

  public loadDefaultWish() {
   this.newGreeting = this.defaultGreeting[this.newGreetingType];
  }

  public createModalClosed() {
    if (this.linkGenerated) {
      this.linkGenerated = false;
      this.isPreview = false;
      this.newReceiver = '';
      this.newLink = '';
      this.whatsappMsg = '';
      this.fbMsg = '';
      this.removeLogo();
    }
  }

  sanitize(url: string) {
    return this._sanitizer.bypassSecurityTrustUrl(url);
  }

  public showPreview() {
    this.isPreview = true;
    this.newReceiver = this.capitilize(this.newReceiver);
    this.newSender = this.capitilize(this.newSender);
    this.displayType = this.newGreetingType;
    this.createModal.hide();
  }

  public openCreateGreetingModal() {
    if (this.isPreview) {
      this.displayType = this.greetingType;
    }
    this.createModal.show();
    this.isPreview = false;
  }

  // Called to get greeting from the server if there is a valid Id
  public getGreeting(id: string) {
    if (!id) {
      this.initializeDefault();
      return;
    }

    const postData = {
      id: id,
      action: 'getgreeting',
    };

    this.post(postData, true).subscribe((data: any) => {
      if (data && data[0]) {
        const response = data[0];
        this.receiverName = response.receiver;
        this.senderName = response.sender;
        this.greetingType = response.type;
        this.greeting =
          response.greeting === this.greetingPlaceholder
            ? this.defaultGreeting[response.type]
            : response.greeting;

        this.newSender = this.receiverName;

        // Flags to show that greeting has been loaded
        this.showMessage = true;
        this.displayType = this.greetingType;

        // Saving the response data for caching
        if (sessionStorage && !sessionStorage.getItem(postData.id)) {
          sessionStorage.setItem(postData.id, JSON.stringify(data));
        }
      } else {
        this.initializeDefault();
      }
    });
  }

  // Save the greeting to the server and dispay the greeting Id link to user
  public saveGreetings() {
    if (!this.allowCreateLinks) {
      return;
    }

    this.newReceiver = this.capitilize(this.newReceiver);
    this.newSender = this.capitilize(this.newSender);

    const postData = {
      sn: this.newSender,
      rc: this.newReceiver,
      gt: this.getGreetingPlaceholder(),
      ty: this.newGreetingType,
      action: 'savegreeting',
    };

    this.post(postData).subscribe((data: any) => {
      if (data && data.status) {
        this.newLink = `https://makemygreeting.000webhostapp.com/?id=${data.greetingId}`;
        const shareMsg = encodeURIComponent(`Hi,
         I've created a ${this.newGreetingType} greeting for you, Check it out: ${this.newLink}`);
        this.whatsappMsg = 'whatsapp://send?text=' + shareMsg;
        this.fbMsg = 'fb-messenger://share/?link=' + shareMsg;
        this.linkGenerated = true;
        this.isPreview = false;
      }
    });
  }

  // ---HTTP Methds with Session Storage Cache-----
  public post(postData: any, caching = false): Observable<any> {
    if (caching && sessionStorage && sessionStorage.getItem(postData.id)) {
      return of(JSON.parse(sessionStorage.getItem(postData.id)));
    } else {
      postData['key'] = Math.floor(Date.now() / 1000)
        .toString(36)
        .toUpperCase();
      return this._http.post('./api/greet.php', postData, this.httpOptions);
    }
  }

  public getQueryParam(key: string) {
    const url = window.location.search;
    let paramValue = '';
    if (url && url.includes('?')) {
      const httpParam = new HttpParams({
        fromString: url.split('?')[1],
      });
      paramValue = httpParam.get(key);
    }
    return paramValue;
  }
}
