import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  public receiverName = '';
  public senderName = '';
  public greeting = '';

  public greetingPlaceholder = '{{Default}}';

  private defaultReceiverName = 'You';
  private defaultSenderName = 'MakeMyGreeting';
  private defaultGreeting = 'May all your Dreams and Wishes come true, and may Success touch your feet. May each day of the New year bring you Luck, Joy, Happiness and Prosperity. Wishing you and your family a Happy New Year';

  public newSender = '';
  public newReceiver =  '';
  public newGreeting = '';

  public linkGenerated = false;
  public newLink = '';
  public whatsappMsg = '';
  public fbMsg = '';
  public isChrome = true;
  public isPreview = false;
  public songSrc = '';
  public showMessage = false;
  //Mode to create new Greeting Links
  public allowCreateLinks = true;

  public httpOptions = {headers: new HttpHeaders({'Content-Type':  'application/json'})};

  constructor(private _http : HttpClient, private _sanitizer : DomSanitizer){
    this.randomSong();
  }

  ngOnInit(){
    this.isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    this.getGreeting(this.getQueryParam('id'));
    this.newGreeting = this.defaultGreeting;
    this.removeLogo();
  }

  public initializeDefault(){
    this.receiverName = this.defaultReceiverName;
    this.senderName = this.defaultSenderName;
    this.greeting = this.defaultGreeting;

    this.showMessage = true;
  }

  public 

  randomSong(){
    let i = parseInt(sessionStorage.getItem('songId'));
    i = Number.isInteger(i) ? (i + 1) % 5 : (Math.random()*5)>>0;
    this.songSrc = `assets/songs/song${i}.mp3`;
    sessionStorage.setItem('songId', i.toString());
  }

  removeLogo(){
    setTimeout(()=> {
      let aElt = document.querySelectorAll('a');
      for(let i = 0; i < aElt.length ; i++){
        if(aElt[i].title.includes('Hosted on free')){
          aElt[i].remove();
          break;
        }
      }},100);
  }

  public capitilize(name : string):string{
    try{
      let nameArry = name.split(' ');
      nameArry = nameArry.map(x=> x[0].toUpperCase() + x.substr(1));
      return nameArry.join(' ');
    }catch(e){
      return name;
    }
  }

  public copyLink(){
    var input = document.createElement('input');
    input.setAttribute('value', this.newLink);
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand('copy');
    document.body.removeChild(input)
    return result;
  }

  public getGreetingPlaceholder(){
    return (this.newGreeting == this.defaultGreeting ? this.greetingPlaceholder : this.newGreeting);
  }

  public saveGreetings(){
    if(!this.allowCreateLinks) return;

    this.newReceiver = this.capitilize(this.newReceiver);
    this.newSender = this.capitilize(this.newSender);

    let postData= {
      'sn': this.newSender,
      'rc': this.newReceiver,
      'gt' : this.getGreetingPlaceholder(),
      'action' : 'savegreeting'
    };

    this.post(postData).subscribe((data : any)=>{
      if(data && data.status){
        this.newLink = `https://makemygreeting.000webhostapp.com/?id=${data.greetingId}`;
        let shareMsg = encodeURIComponent(`Hey ${this.newReceiver},
         ${this.newSender} has sent you a lovely New Year Greeting, Read Here: ${this.newLink}`);
        this.whatsappMsg = 'whatsapp://send?text=' + shareMsg;
        this.fbMsg = 'fb-messenger://share/?link=' + shareMsg;
        this.linkGenerated = true;
        this.isPreview = false;
      }
    })
  }

  public createModalClosed(){
    if(this.linkGenerated){
      this.linkGenerated = false;
      this.isPreview = false;
      this.newReceiver = '';
      this.newLink = '';
      this.whatsappMsg = '';
      this.fbMsg = '';
      this.removeLogo();
    }
  }

  sanitize(url:string){
    return this._sanitizer.bypassSecurityTrustUrl(url);
  }

  public showPreview(){
    this.isPreview = true;
    this.newReceiver = this.capitilize(this.newReceiver);
    this.newSender = this.capitilize(this.newSender);
  }

  //Called to get greeting from the server if there is a valid Id
  public getGreeting(id : string){
    if(!id || id.length != 12) {
      this.initializeDefault();
      return;
    }

    let postData= {
      'id': id,
      'action' : 'getgreeting'
    };

    this.post(postData).subscribe((data : any)=>{
      if(data && data[0]){
        let obj = data[0];
         this.receiverName = obj.receiver;
         this.senderName = obj.sender;
         this.greeting = obj.greeting === this.greetingPlaceholder ? this.defaultGreeting : obj.greeting;

         this.newSender = this.receiverName;
         this.showMessage = true;
         if(sessionStorage && !sessionStorage.getItem(postData.id)){
           sessionStorage.setItem(postData.id,JSON.stringify(data));
         }
      }else{
         this.initializeDefault();
      }
    })
  }

  

  //---HTTP Methds with Session Storage Cache-----
  public post(postData:any):Observable<any>{
    if(sessionStorage && sessionStorage.getItem(postData.id)){
      return of(JSON.parse(sessionStorage.getItem(postData.id)));
    } else {
      postData['key'] = (Math.floor(Date.now()/1000)).toString(36).toUpperCase();
      return this._http.post('./api/greet.php', postData, this.httpOptions);
    }
  }

  public getQueryParam(key : string){
    let url = window.location.search;
    let paramValue = '';
    if(url && url.includes('?')){
      let httpParam = new HttpParams({
          fromString : url.split('?')[1]
        });
        paramValue = httpParam.get(key);
    }
    return paramValue;
  }

}
