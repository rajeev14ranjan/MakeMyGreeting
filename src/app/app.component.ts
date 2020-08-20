import { Component, OnInit, ViewChild } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { DomSanitizer } from "@angular/platform-browser";
import { ModalDirective } from "ngx-bootstrap/modal";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  public receiverName = "";
  public senderName = "";
  public greeting = "";
  public greetingType = "HNY";

  public displayType = "";

  public initialMessage = "Loading your Greeting ...";

  public greetingPlaceholder = "{{Default}}";

  // Default Values to be loaded
  private defaultGreeting = {
    HNY:
      "May all your Dreams and Wishes come true, and may Success touch your feet. May each day of the New year bring you Luck, Joy, Happiness and Prosperity. Wishing you and your family a Happy New Year",
    HBD:
      "Hope your special day brings you all that your heart desires! Here’s wishing you a day full of pleasant surprises, Happy Birthday !",
  };

  private songCount = {
    HNY: 5,
    HBD: 4,
  };

  private untrackableKey = "key_untracakable";

  // Flags
  public songSrc = "";
  public isMute = true;
  public showMessage = false;
  public untrackable = false;
  public songPlayer: HTMLAudioElement;

  // http Options for Post call
  public httpOptions = {
    headers: new HttpHeaders({ "Content-Type": "application/json" }),
  };

  constructor(private _http: HttpClient, private _sanitizer: DomSanitizer) {
    this.untrackable = localStorage.getItem(this.untrackableKey) === "true";
  }

  public visibleFor(type: string): Boolean {
    return this.displayType === type;
  }

  ngOnInit() {
    this.getGreeting(this.getQueryParam("id"));
    this.songPlayer = this.getSongPlayerElt();
    this.removeLogo();
  }

  public getSongPlayerElt(): HTMLAudioElement {
    return <HTMLAudioElement>document.getElementById("songPlayer");
  }

  public initializeError() {
    this.initialMessage = `<code>Greeting couldn't be loaded! <br/> Please try again!</code>`;
  }

  public onSongEnded() {
    this.isMute = true;
    this.generateNextSongSrc();
  }

  public generateNextSongSrc() {
    const lastSong =
      parseInt(sessionStorage.getItem("key_songId"), 10) ||
      Math.floor(Math.random() * this.songCount[this.greetingType]);
    const nextSong = (lastSong + 1) % this.songCount[this.greetingType];
    this.songSrc = `assets/songs/${this.greetingType}/song${nextSong}.mp3`;
    sessionStorage.setItem("key_songId", nextSong.toString());
    if (!this.songPlayer) {
      this.songPlayer = this.getSongPlayerElt();
    }
    if (this.songPlayer) {
      this.songPlayer.src = this.songSrc;
      this.songPlayer.load();
    }
  }

  removeLogo() {
    setTimeout(() => {
      const aElt = document.querySelectorAll("a");
      for (let i = 0; i < aElt.length; i++) {
        if (aElt[i].title.includes("Hosted on free")) {
          aElt[i].remove();
          break;
        }
      }
    }, 300);
  }

  sanitize(url: string) {
    return this._sanitizer.bypassSecurityTrustUrl(url);
  }

  // Called to get greeting from the server if there is a valid Id
  public getGreeting(id: string) {
    if (!id) {
      this.initializeError();
      return;
    }

    const postData = {
      id: id,
      ut: this.untrackable,
      action: "getgreeting",
    };

    this.post(postData, true).subscribe(
      (data: any) => {
        if (data && data[0]) {
          const response = data[0];
          this.receiverName = response.receiver;
          this.senderName = response.sender;
          this.greetingType = response.type;
          this.greeting =
            response.greeting === this.greetingPlaceholder
              ? this.defaultGreeting[response.type]
              : response.greeting;

          // Flags to show that greeting has been loaded
          this.showMessage = true;
          this.displayType = this.greetingType;

          // Getting next source song as per greeting type
          this.generateNextSongSrc();

          // Saving the response data for caching
          if (sessionStorage && !sessionStorage.getItem(postData.id)) {
            sessionStorage.setItem(postData.id, JSON.stringify(data));
          }
        } else {
          this.initializeError();
        }
      },
      (error) => this.initializeError()
    );
  }

  public togglePlayer() {
    this.isMute = !this.isMute;
    this.isMute ? this.songPlayer.pause() : this.songPlayer.play();
  }

  // ---HTTP Methds with Session Storage Cache-----
  public post(postData: any, caching = false): Observable<any> {
    if (caching && sessionStorage && sessionStorage.getItem(postData.id)) {
      return of(JSON.parse(sessionStorage.getItem(postData.id)));
    } else {
      postData["key"] = Math.floor(Date.now() / 1000)
        .toString(36)
        .toUpperCase();
      return this._http.post("./api/greet.php", postData, this.httpOptions);
    }
  }

  public getQueryParam(key: string) {
    const url = window.location.search;
    let paramValue = "";
    if (url && url.includes("?")) {
      const httpParam = new HttpParams({
        fromString: url.split("?")[1],
      });
      paramValue = httpParam.get(key);
    }
    return paramValue;
  }
} // End closing tag of component
