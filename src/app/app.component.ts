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

  public greetingPlaceholder = "{{Default}}";

  //Private ID
  private id: string;

  // Default Values to be loaded
  private defaultReceiverName = "You";
  private defaultSenderName = "MakeMyGreeting";
  private defaultGreeting = {
    HNY:
      "May all your Dreams and Wishes come true, and may Success touch your feet. May each day of the New year bring you Luck, Joy, Happiness and Prosperity. Wishing you and your family a Happy New Year",
    HBD:
      "Hope your special day brings you all that your heart desires! Here’s wishing you a day full of pleasant surprises, Happy Birthday !",
    CNG: "Congratulations on your achievement",
  };
  private defaultType = "HNY";
  private songCount = {
    CNG: 1,
    HNY: 5,
    HBD: 4,
  };
  private untrackableKey = "key_untracakable";

  // Values for creating/previewing new greetings
  public newSender = "";
  public newReceiver = "";
  public newGreeting = "";
  public newGreetingType = "HNY";

  // Flags
  public linkGenerated = false;
  public newLink = "";
  public whatsappMsg = "";
  public fbMsg = "";
  public isPreview = false;
  public songSrc = "";
  public isMute = true;
  public showMessage = false;
  public untrackable = false;
  public songPlayer: HTMLAudioElement;

  // Mode to create new Greeting Links
  public allowCreateLinks = true;

  //Tracking
  public allowTracking = false;
  public visitingDetails = null;
  public showVisitDetails = false;
  public trackingAuthentication = false;
  public trackingPw = "";
  public trackingDetails = [];
  private trackingSortby = "LST";
  public trackingAuthKey = "auth_key_track";
  private trackingHash = 1514221;

  //Deleting ids
  public deleteIds = new Set();

  // http Options for Post call
  public httpOptions = {
    headers: new HttpHeaders({ "Content-Type": "application/json" }),
  };

  //Video Formats
  public videoTypes = ["mp4", "webm", "ogg"];
  public videoTitle = {
    HNY: "firework",
    HBD: "firework",
    CNG: "confetti",
  };

  @ViewChild("createModal") createModal: ModalDirective;
  @ViewChild("trackModal") trackModal: ModalDirective;
  @ViewChild("trackAuthModal") trackAuthModal: ModalDirective;

  constructor(private _http: HttpClient, private _sanitizer: DomSanitizer) {
    this.untrackable = localStorage.getItem(this.untrackableKey) === "true";
  }

  ngOnInit() {
    this.id = this.getQueryParam("id");
    this.getGreeting(this.id);
    this.newGreeting = this.defaultGreeting[this.defaultType];
    this.songPlayer = this.getSongPlayerElt();
    this.removeLogo();
  }

  public getVideoSource(src: string, type: string) {
    let source = document.createElement("source");
    source.setAttribute("src", src);
    source.setAttribute("type", type);
    return source;
  }

  public prepareVideoBackground() {
    let videoElt = <HTMLVideoElement>document.getElementById("videoBG");
    videoElt.innerHTML = "";
    this.videoTypes.forEach((type) => {
      videoElt.appendChild(
        this.getVideoSource(
          `assets/img/${this.videoTitle[this.greetingType]}.${type}`,
          `video/${type}`
        )
      );
    });
  }

  public getSongPlayerElt(): HTMLAudioElement {
    return <HTMLAudioElement>document.getElementById("songPlayer");
  }

  public initializeDefault() {
    this.receiverName = this.defaultReceiverName;
    this.senderName = this.defaultSenderName;
    this.greeting = this.defaultGreeting[this.defaultType];
    this.greetingType = this.displayType = this.defaultType;
    this.showMessage = true;
    this.generateNextSongSrc();
    this.prepareVideoBackground();
  }

  public visibleFor(type: string): Boolean {
    return this.displayType === type;
  }

  public onSongEnded() {
    this.isMute = true;
    this.generateNextSongSrc();
  }

  public generateNextSongSrc() {
    let songStorageId = `key_songId_${this.greetingType}`;
    const lastSong = parseInt(localStorage.getItem(songStorageId), 10) || 0;
    const nextSong = (lastSong + 1) % this.songCount[this.greetingType];
    this.songSrc = `assets/songs/${this.greetingType}/song${nextSong}.mp3`;
    localStorage.setItem(songStorageId, nextSong.toString());
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
    }, 100);
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

  sanitize(url: string) {
    return this._sanitizer.bypassSecurityTrustUrl(url);
  }

  // Called to get greeting from the server if there is a valid Id
  public getGreeting(id: string) {
    if (!id) {
      this.initializeDefault();
      return;
    }

    const postData = {
      id: id,
      ut: this.untrackable,
      action: "getagreeting",
    };

    this.post(postData, true).subscribe((data: any) => {
      if (data && data[0]) {
        const response = data[0];
        this.receiverName = response.receiver;
        this.senderName = response.sender;
        this.greetingType = response.type;
        this.allowTracking = response.atf;
        this.greeting =
          response.greeting === this.greetingPlaceholder
            ? this.defaultGreeting[response.type]
            : response.greeting;

        this.newSender = this.receiverName;

        // Flags to show that greeting has been loaded
        this.showMessage = true;
        this.displayType = this.greetingType;

        // Getting next source song as per greeting type
        this.generateNextSongSrc();

        // Saving the response data for caching
        this.saveGreetingToSession(postData.id, data);

        //preparing video backgroung as per greetingtype
        this.prepareVideoBackground();
      } else {
        this.initializeDefault();
      }
    });
  }

  public saveGreetingToSession(id: string, data: any) {
    if (sessionStorage && !sessionStorage.getItem(id)) {
      sessionStorage.setItem(id, JSON.stringify(data));
    }
  }

  public togglePlayer() {
    this.isMute = !this.isMute;
    this.isMute ? this.songPlayer.pause() : this.songPlayer.play();
  }

  public toggleTrackable() {
    this.untrackable = !this.untrackable;
    localStorage.setItem(this.untrackableKey, this.untrackable.toString());
  }

  // ---HTTP Methds with Session Storage Cache-----
  public post(postData: any, caching = false): Observable<any> {
    if (caching && sessionStorage && sessionStorage.getItem(postData.id)) {
      return of(JSON.parse(sessionStorage.getItem(postData.id)));
    }

    postData["key"] = Math.floor(Date.now() / 1000)
      .toString(36)
      .toUpperCase();

    return this._http.post("./api/greet.php", postData, this.httpOptions);
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

  // **********************Only for the create part*************************

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
      action: "savegreeting",
    };

    this.linkGenerated = true;
    this.newLink = "";

    this.post(postData).subscribe(
      (data: any) => {
        if (data && data.status) {
          this.newLink = `https://makemygreeting.000webhostapp.com/?id=${data.greetingId}`;
          const shareMsg = encodeURIComponent(`Hi,
       I'm sending a ${this.newGreetingType} greeting for you, Check it out: ${this.newLink}`);
          this.whatsappMsg = "whatsapp://send?text=" + shareMsg;
          this.fbMsg = "fb-messenger://share/?link=" + shareMsg;
          this.isPreview = false;
        }
      },
      (error: any) => {
        this.linkGenerated = false;
      }
    );
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

  public selectForDelete(e: any, id: string) {
    e.target.checked ? this.deleteIds.add(id) : this.deleteIds.delete(id);
  }

  public selectForDetails(id: string) {
    const postData = {
      id: id,
      ut: true,
      action: "getgreeting",
    };

    this.showVisitDetails = true;
    this.visitingDetails = null;
    this.post(postData, true).subscribe((data: any) => {
      if (data && data[0]) {
        this.visitingDetails = {
          ...data[0],
          id,
          last: data[0].last ? new Date(`${data[0].last} GMT+0`) : null,
          time: data[0].time ? new Date(`${data[0].time} GMT+0`) : data[0].time,
          greeting:
            data[0].greeting === this.greetingPlaceholder
              ? this.defaultGreeting[data[0].type]
              : data[0].greeting,
        };
        // Saving the response data for caching
        this.saveGreetingToSession(id, data);
      }
    });
  }

  public checkTrackingAuth(): boolean {
    let lastAuthKey = sessionStorage.getItem(this.trackingAuthKey);
    if (lastAuthKey && this.hash(lastAuthKey) === this.trackingHash) {
      this.trackingAuthentication = true;
      return true;
    }

    this.trackingAuthentication =
      this.hash(this.trackingPw) === this.trackingHash;
    if (this.trackingAuthentication) {
      sessionStorage.setItem(this.trackingAuthKey, this.trackingPw);
    }
    this.trackingPw = "";
    return this.trackingAuthentication;
  }

  public openTrackingModal() {
    this.trackingDetails.length = 0;
    this.deleteIds.clear();
    this.showVisitDetails = false;
    this.trackingSortby = "LST";

    if (!this.allowTracking) return;
    this.trackModal.show();
    if (!this.checkTrackingAuth()) return;

    const postData = {
      action: "gettracking",
    };

    this.post(postData).subscribe((data: any) => {
      if (data && data.length) {
        this.trackingDetails = data;
      }
    });
  }

  public reorderTracking() {
    let sorter: Function;

    switch (this.trackingSortby) {
      case "LSO":
        sorter = (a, b) => {
          if (!a.last) return 1;
          if (!b.last) return -1;
          return Date.parse(b.last) - Date.parse(a.last);
        };
        break;
      case "MXG":
        sorter = (a, b) => {
          if (!a.last) return 1;
          if (!b.last) return -1;
          return Date.parse(a.last) -
            Date.parse(a.time) -
            Date.parse(b.last) +
            Date.parse(b.time) >
            0
            ? -1
            : 1;
        };
        break;
      case "MXT":
        sorter = (a, b) => parseInt(b.count) - parseInt(a.count);
        break;
      default:
        sorter = (a, b) => Date.parse(b.time) - Date.parse(a.time);
    }

    this.sortByTracking(sorter);
  }

  public sortByTracking(sorter: Function) {
    this.trackingDetails = this.trackingDetails
      .sort((a, b) => sorter(a, b))
      .map((detail) => detail);
  }

  public trackByFn(_, item: any) {
    return item.id;
  }

  public closeTrackModal() {
    if (this.showVisitDetails) this.showVisitDetails = false;
    else this.trackModal.hide();
  }

  public deleteSelectedIds() {
    const postData = {
      action: "deleteids",
      ids: Array.from(this.deleteIds),
    };

    this.post(postData).subscribe((data: any) => {
      if (data && data.status) {
        this.trackingDetails = this.trackingDetails.filter(
          ({ id }) => !this.deleteIds.has(id)
        );
        this.deleteIds.clear();
      }
    });
  }

  public capitilize(name: string): string {
    try {
      let nameArry = name.split(" ");
      nameArry = nameArry.map((x) => x[0].toUpperCase() + x.substr(1));
      return nameArry.join(" ");
    } catch (e) {
      return name;
    }
  }

  public copyLink() {
    const input = document.createElement("input");
    input.setAttribute("value", this.newLink);
    document.body.appendChild(input);
    input.select();
    const result = document.execCommand("copy");
    document.body.removeChild(input);
    return result;
  }

  public createModalClosed() {
    if (this.linkGenerated) {
      this.linkGenerated = false;
      this.isPreview = false;
      this.newReceiver = "";
      this.newLink = "";
      this.whatsappMsg = "";
      this.fbMsg = "";
      this.removeLogo();
    }
  }

  public hash(s: string) {
    let h = 0,
      i,
      c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      h = (h << 5) - h + c;
      h |= 0;
    }
    return h;
  }
} // End closing tag of component
