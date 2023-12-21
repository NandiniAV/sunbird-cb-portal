import { Component, HostListener } from '@angular/core'
import { ProgressIndicatorLocation, GuidedTour, Orientation, GuidedTourService } from 'cb-tour-guide';
import { UtilityService, EventService, WsEvents, ConfigurationsService } from '@sunbird-cb/utils';
import { UserProfileService } from '@ws/app/src/lib/routes/user-profile/services/user-profile.service';
@Component({
  selector: 'app-tour',
  templateUrl: './app-tour.component.html',
  styleUrls: ['./app-tour.component.scss'],
  providers:[UserProfileService]
})

export class AppTourComponent {
  progressIndicatorLocation = ProgressIndicatorLocation.TopOfTourBlock;
  currentWindow: any
  videoProgressTime: number = 114;
  tourStatus: any = {visited: true, skipped: false}
  
  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.skipTour('','')
    }
  }

  private readonly TOUR: GuidedTour = {
    tourId: 'purchases-tour',
    useOrb: false,
    completeCallback: () => this.completeTour(),
    nextCallback: (currentStep, stepObject) => this.nextCb(currentStep, stepObject),
    prevCallback: (currentStep, stepObject) => this.prevCb(currentStep, stepObject),
    closeModalCallback: () => setTimeout(() => {
      this.closeModal()
    }, 500),
    steps: [
      {
        icon: 'school',
        connectorDirection: 'left',
        title: 'Learn',
        selector: '#Learn',
        class: 'tour_learn',
        containerClass: 'tour_learn_container',
        content: 'Drive your career forward through appropriate courses, programs and assessments.',
        orientation: Orientation.BottomLeft,
        nextBtnClass: 'action-orange mat-button',
        backBtnClass: 'back',
        skipBtnClass: 'skip'
      },
      {
        icon: 'forum',
        connectorDirection: 'left',
        title: 'Discuss',
        selector: '#Discuss',
        class: 'tour_discuss',
        containerClass: 'tour_discuss_container',
        content: 'Discuss new ideas with colleagues and experts in the government.',
        orientation: Orientation.BottomLeft,
        nextBtnClass: 'action-orange mat-button',
        backBtnClass: 'back',
        skipBtnClass: 'skip'
      },
      {
        icon: 'search',
        connectorDirection: 'left',
        title: 'Search',
        selector: '#app-search-bar',
        class: 'tour_search',
        containerClass: 'tour_search_container',
        content: 'Find the perfect course and program tailor-made for you.',
        orientation: Orientation.BottomLeft,
        nextBtnClass: 'action-orange mat-button',
        backBtnClass: 'back',
        skipBtnClass: 'skip'
      },
      {
        icon: 'person',
        connectorDirection: 'right',
        title: 'My Profile',
        selector: '#user_icon',
        class: 'tour_profile',
        containerClass: 'tour_profile_container',
        content: 'Update your information to get the best-suited courses and programs.',
        orientation: Orientation.BottomRight,
        nextBtnClass: 'action-orange mat-button',
        backBtnClass: 'back',
        skipBtnClass: 'skip'
      },
    ],
    preventBackdropFromAdvancing: true
  };
  
  private readonly MOBILE_TOUR: GuidedTour = {
    tourId: 'purchases-tour',
    useOrb: false,
    completeCallback: () => this.completeTour(),
    steps: [
      {
        icon: 'school',
        isMobile: true,
        connectorDirection: 'top',
        title: 'Learn',
        selector: '#Learn',
        class: 'tour_learn_mobile',
        containerClass: 'tour_learn_mobile_container',
        content: 'Drive your career forward through appropriate courses, programs and assessments.',
        orientation: Orientation.BottomLeft,
        nextBtnClass: 'action-orange mat-button',
        backBtnClass: 'back',
        skipBtnClass: 'skip'
      },
      {
        icon: 'forum',
        isMobile: true,
        connectorDirection: 'top',
        title: 'Discuss',
        selector: '#Discuss',
        class: 'tour_discuss_mobile',
        containerClass: 'tour_discuss_mobile_container',
        content: 'Discuss new ideas with colleagues and experts in the government.',
        orientation: Orientation.Bottom,
        nextBtnClass: 'action-orange mat-button',
        backBtnClass: 'back',
        skipBtnClass: 'skip'
      },
      {
        icon: 'search',
        isMobile: true,
        connectorDirection: 'bottom',
        title: 'Search',
        selector: '#feature_mobile_search',
        class: 'tour_search_mobile',
        containerClass: 'tour_search_mobile_container',
        content: 'Find the perfect course and program tailor-made for you.',
        orientation: Orientation.TopRight,
        nextBtnClass: 'action-orange mat-button',
        backBtnClass: 'back',
        skipBtnClass: 'skip'
      },
      {
        icon: 'person',
        isMobile: true,
        connectorDirection: 'top',
        title: 'My Profile',
        selector: '#user_icon',
        class: 'tour_profile_mobile',
        containerClass: 'tour_profile_mobile_container',
        content: 'Update your information to get the best-suited courses and programs.',
        orientation: Orientation.BottomLeft,
        nextBtnClass: 'action-orange mat-button',
        backBtnClass: 'back',
        skipBtnClass: 'skip'
      },
    ],
  };
  showpopup: boolean = true;
  noScroll: boolean = true;
  closePopupIcon: boolean = true;
  showCompletePopup: boolean = false;
  showVideoTour: boolean = false;
  isMobile: boolean = false;
  hideCloseBtn: boolean = false;

  constructor(private guidedTourService: GuidedTourService,
    private utilitySvc: UtilityService,private configSvc: ConfigurationsService,
    private events: EventService, private userProfileSvc: UserProfileService) {
    this.isMobile = this.utilitySvc.isMobile;
    this.raiseGetStartedStartTelemetry()
  }

  updateTourstatus(status: any) {
    let reqUpdates = {
      request: {
        userId: this.configSvc.unMappedUser.id,
        profileDetails: {get_started_tour: status}
      }
    }
    this.userProfileSvc.editProfileDetails(reqUpdates).subscribe(_res => {
      // console.log("re s ", res )
    })
  }

  emitFromVideo(event: any){
    if (event === 'skip'){
      this.skipTour(`video-${event}`, 'video')
    } else {
      this.startTour(`welcome-${event}`, 'welcome')
    }
  }

  public startTour(screen: string, subType: string): void {
    this.showpopup = false;
    this.showVideoTour = false;
    this.raiseTemeletyInterat(screen, subType)
    if (this.isMobile) {
      // @ts-ignore
      setTimeout(() => {
        this.guidedTourService.startTour(this.MOBILE_TOUR);
      }, 2000);
    } else {
      this.guidedTourService.startTour(this.TOUR);
      setTimeout(() => {
        // @ts-ignore
        const _left = parseFloat(document.getElementsByClassName('tour_learn')[0]['style']['left'].split('px')[0]);
        // @ts-ignore
        document.getElementsByClassName('tour_learn')[0]['style']['left'] = (_left - 10) + 'px';
      }, 100);
    }

  }

  public skipTour(screen: string, subType: string): void {
    //localStorage.setItem('tourGuide',JSON.stringify({'disable': true}) )
    this.updateTourstatus({visited: true, skipped: true})
    this.configSvc.updateTourGuideMethod(true)
    if (screen.length > 0 && subType.length > 0) {
      this.raiseTemeletyInterat(screen, subType)
    } else {
      if(this.currentWindow) {
        this.raiseTemeletyInterat(`${this.currentWindow.title.toLowerCase().replace(' ','-')}-skip`, this.currentWindow.title.toLowerCase())
      } else {
        this.raiseTemeletyInterat('welcome-skip', 'welcome')
      }
    }
    this.raiseGetStartedEndTelemetry()
    this.noScroll = false;
    this.showpopup = false;
    this.showVideoTour = false;
    this.showCompletePopup = false;
    this.closePopupIcon = false;
    setTimeout(() => {
      this.guidedTourService && this.guidedTourService.skipTour();
    }, 2000);
    if (this.isMobile) {
       // @ts-ignore
       setTimeout(() => {
         this.guidedTourService.startTour(this.MOBILE_TOUR);
       }, 2000);
    }
  }

  completeTour(): void {
    this.hideCloseBtn = false;
    this.showpopup = false;
    this.showCompletePopup = true;
    setTimeout(() => {
      this.onCongrats();
    }, 3000);
    this.raiseGetStartedEndTelemetry()
    this.updateTourstatus({visited: true, skipped: false})
  }

  onCongrats(): void {
    this.showCompletePopup = false;
    //localStorage.setItem('tourGuide',JSON.stringify({'disable': true}) )
    this.configSvc.updateTourGuideMethod(true)
  }

  startApp(): void {
    this.showpopup = true;
  }

  starVideoPlayer() {
    this.showpopup = false;
    this.showVideoTour = true;
  }

  nextCb(currentStep: number, stepObject:any) {
    // if (stepObject.title == 'My Profile') {
    //   this.hideCloseBtn = true;
    // }
    this.currentWindow = stepObject
    let currentStepObj: any = this.TOUR.steps[currentStep - 1]
    this.raiseTemeletyInterat(`${currentStepObj.title.toLowerCase().replace(' ','-')}-next`, currentStepObj.title.toLowerCase())
  }

  prevCb(currentStep: number, stepObject:any) {
    this.hideCloseBtn = false;
    this.currentWindow = stepObject
    let currentStepObj: any = this.TOUR.steps[currentStep +  1]
    this.raiseTemeletyInterat(`${currentStepObj.title.toLowerCase().replace(' ','-')}-previous`, currentStepObj.title.toLowerCase())
  }

  raiseGetStartedStartTelemetry() {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: '' },
        object: {},
        state: WsEvents.EnumTelemetrySubType.Loaded,
        eventSubType: WsEvents.EnumTelemetrySubType.GetStarted,
        type: 'Get Started',
        mode: 'view',
      },
      pageContext: {pageId: "/home", module: WsEvents.EnumTelemetrySubType.GetStarted},
      from: '',
      to: 'Telemetry',
    }
    this.events.dispatchGetStartedEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  raiseTemeletyInterat(id: string, stype: string) {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: 'click', id: id, subType: stype},
        object: {},
        state: WsEvents.EnumTelemetrySubType.Interact,
        eventSubType: WsEvents.EnumTelemetrySubType.GetStarted,
        mode: 'view'
      },
      pageContext: {pageId: '/home', module: WsEvents.EnumTelemetrySubType.GetStarted},
      from: '',
      to: 'Telemetry',
    }
    this.events.dispatchGetStartedEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  raiseGetStartedEndTelemetry() {
    const event = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        edata: { type: '' },
        object: {},
        state: WsEvents.EnumTelemetrySubType.Unloaded,
        eventSubType: WsEvents.EnumTelemetrySubType.GetStarted,
        type: 'Get Started',
        mode: 'view',
      },
      pageContext: {pageId: "/home", module: WsEvents.EnumTelemetrySubType.GetStarted},
      from: '',
      to: 'Telemetry',
    }
    this.events.dispatchGetStartedEvent<WsEvents.IWsEventTelemetryInteract>(event)
  }

  closeModal() {
    this.skipTour('','');
  }
}
