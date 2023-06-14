
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, Subscription, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { UserService } from '@sunbird/core';
import * as _ from 'lodash-es';
import { DomSanitizer } from '@angular/platform-browser';


@Component({
  selector: 'app-teacher-companion-popup',
  templateUrl: './teacher-companion-popup.component.html',
  styleUrls: ['./teacher-companion-popup.component.scss'],
})
export class TeacherCompanionPopupComponent implements OnInit {
  constructor(private dialogRef: MatDialogRef<TeacherCompanionPopupComponent>, private http: HttpClient, private userService: UserService, @Inject(MAT_DIALOG_DATA) public data: any, private sanitizer: DomSanitizer,) { }
  firstPage: boolean;
  secondPage: boolean;
  selectedOption: string = '';
  searchQuery: string;
  showDesc: boolean;
  bookDescription = '';
  chapterTilte = '';
  uuid;
  apiResData = '';
  isLoading: boolean = true;
  userSubscription: Subscription;
  public unsubscribe$ = new Subject<void>();
  userProfile: any;
  userName; any;
  contentHeight;
  usertType = '';
  pageTitle = '';
  options = [{}];
  isTeacher: boolean = true;
  isStudent: boolean = false;
  botImg;
  quizHover: string;
  summaryHover: string;
  aidHover: string;
  impHover: string;
  texbookIdConfig =
    {
      "do_2138168881245880321735": "4c67c7f4-0919-11ee-9081-0242ac110002"
    }
  conversion = [];
  ngOnInit() {
    this.options = this.data.children;
    this.userTypeConfig();
    this.uuid = this.texbookIdConfig[this.data.identifier];
    this.firstPage = true;
    this.secondPage = false;
    this.showDesc = false;
    this.getUserDetails()
  }
  userTypeConfig() {
    this.usertType = this.data.userType;
    if (this.usertType === 'teacher') {
      this.isTeacher = true;
      this.isStudent = false;
      this.pageTitle = 'What Chapter Are You Teaching Today !!'
      this.botImg = "../../../../../../dist/assets/images/tt.png";
      this.quizHover = "Generate questions to test your students";
      this.summaryHover = "Summarize the chapter for you.";
      this.aidHover = "Resources to help you teach this chapter";
    }
    else if (this.usertType === 'student') {
      this.isStudent = true;
      this.isTeacher = false;
      this.pageTitle = 'What do you want to learn today?';
      this.botImg = "../../../../../../dist/assets/images/st.png";
      this.quizHover = "Generate questions to learn";
      this.summaryHover = "Summarize the chapter for you..";
      this.impHover = "Important Words with meaning";
    }
  }
  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getUserDetails() {
    this.userSubscription = this.userService.userData$.subscribe((user: any) => {
      if (user.userProfile) {
        this.userName = _.get(user.userProfile, 'firstName');
        console.log('user', user);
        console.log('this.', this.userName);
      }
    });
  }

  toGetApiResponse(querParms, uuid, isTeacherAid = false): Observable<any> {
    this.isLoading = false;
    const url = `http://20.244.48.128:8000/query-with-langchain-gpt4?uuid_number=${uuid}&query_string=${encodeURIComponent(querParms)}`;
    return this.http.get(url).pipe(
      delay(2000)
    ).pipe(
      map((data: any) => {
        this.apiResData = data.answer;
        let resObject = {
          index: this.conversion.length + 1,
          question: data.query,
          response: data.answer,
          isError: false,
          extraContent: null
        }
        if (isTeacherAid && this.usertType === 'teacher') {
          let extraContent = `
          Here are courses which can help you learn more about this chapter:
          Misconceptions in Crop Production - https://staging.sunbirded.org/explore-course/course/do_21381708612600627211220
          Misconceptions in Crop Management - https://staging.sunbirded.org/explore-course/course/do_21381707533008076811064
          Other resources that you can refer to:
          Introduction to Crop Production - https://www.youtube.com/watch?v=xR2DPnyLEE0
          Common misconceptions in Crop Production - https://www.youtube.com/watch?v=8ulpy_GFLDk&t=10s
          How to mitigate misconceptions - https://www.youtube.com/watch?v=VaDccWJJ864
          Introduction to Crop Management - https://www.youtube.com/watch?v=NCp93xbSwWM
          Common misconceptions in Crop Management - https://www.youtube.com/watch?v=zSCR2K81IRo
          How to mitigate misconceptions - https://www.youtube.com/watch?v=khXPo_QY0B8
          `;
          resObject.extraContent = extraContent
        }
        this.conversion.push(resObject);
        setTimeout(() => {
          document.getElementById('chatAnswer' + resObject.index).scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 1000)
        this.isLoading = true;
        this.searchQuery = '';
        return data;
      }),
      catchError((error: any) => {
        console.error(error);
        this.isLoading = true;
        let resObject = {
          index: this.conversion.length + 1,
          question: querParms,
          response: 'Unable to fetch the details please try again !! ',
          isError: true
        }
        this.conversion.push(resObject);
        setTimeout(() => {
          document.getElementById('chatAnswer' + resObject.index).scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 1000)
        return throwError(error); // Rethrow the error or return a default value
      })
    );
  }
  closeDialog(): void {
    this.dialogRef.close();
  }
  onSubmit($) {
    if (this.selectedOption) {
      console.log('$$$', $);
      this.firstPage = false;
      this.secondPage = true;
      this.chapterTilte = this.selectedOption
      console.log('hi')
    }
  }
  searchBasedQuery() {
    this.showDesc = true;
    this.firstPage = false;
    this.toGetApiResponse(this.searchQuery, this.uuid).subscribe(data => {
      this.bookDescription = data.answer;
    });
    console.log(this.conversion);
    console.log('Search query:', this.searchQuery);
  }
  onFeatureClick(val) {
    this.showDesc = true;
    this.firstPage = false;
    if (val === "Quiz") {
      console.log(val)
      let Quiz = this.isTeacher ? 'Generate 5 MCQ for this ' + this.chapterTilte : 'As a student, give me 5 MCQ with correct answer for this chapter ' + this.chapterTilte;
      this.toGetApiResponse(Quiz, this.uuid).subscribe(data => {
        this.bookDescription = data.answer;
      });
      console.log(this.conversion);

    }
    else if (val === "Summary") {
      console.log(val)
      let Summary = this.isTeacher ? 'Summarize ' + this.chapterTilte : 'As a student, give me an easy to understand summary of this chapter ' + this.chapterTilte;
      this.toGetApiResponse(Summary, this.uuid).subscribe(data => {
      });
      console.log(this.conversion);

    }
    else if (val === "Material") {
      this.toGetApiResponse('how to teach ' + this.chapterTilte + ' with activities', this.uuid, true).subscribe(data => {
      });
      console.log(this.conversion);
    }
    else if (val === 'importantWords') {
      let importantWords = 'Important Words with meaning - As a student, tell me important words about this chapter that I should learn this chapter ' + this.chapterTilte;
      this.toGetApiResponse(importantWords, this.uuid, true).subscribe(data => {
      });
    }

  }
  transformHTML(data: any) {
    return this.sanitizer.bypassSecurityTrustHtml(data);
  }
}
