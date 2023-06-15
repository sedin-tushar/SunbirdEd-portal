
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, Subscription, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { UserService } from '@sunbird/core';
import * as _ from 'lodash-es';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  isTeachingAid: boolean = false;
  isSearchQuery: boolean = false;
  trustedHtml: SafeHtml;
  texbookIdConfig =
    {
      "do_2138168881245880321735": "4c67c7f4-0919-11ee-9081-0242ac110002"
    }
  courseUrlList = '';
  conversion = [];
  ngOnInit() {
    this.options = this.data.children;
    this.userTypeConfig();
    this.uuid = this.texbookIdConfig[this.data.identifier];
    this.firstPage = true;
    this.secondPage = false;
    this.showDesc = false;
    this.getUserDetails();
  }
  userTypeConfig() {
    this.usertType = this.data.userType;
    if (this.usertType === 'teacher') {
      this.isTeacher = true;
      this.isStudent = false;
      this.pageTitle = 'What Chapter Are You Teaching Today ?'
      this.botImg = "../../../../../../dist/assets/images/tt.png";
      this.quizHover = "Generate questions to test your students";
      this.summaryHover = "Summarize the chapter for you.";
      this.aidHover = "Resources to help you teach this chapter";
    }
    else if (this.usertType === 'student') {
      this.isStudent = true;
      this.isTeacher = false;
      this.pageTitle = 'What do you want to learn today ?';
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
      }
    },
      (error) => {
        this.userName = "Guest";
      });

    if (!this.userSubscription)
      this.userName = "Guest";

  }

  toGetApiResponse(querParms, uuid, isTeacherAid = false): Observable<any> {
    this.isLoading = false;
    const url = `http://20.244.48.128:8000/query-with-langchain-gpt4?uuid_number=${uuid}&query_string=${encodeURIComponent(querParms)}`;
    return this.http.get(url).pipe(
      delay(2000)
    ).pipe(
      map((data: any) => {
        this.apiResData = this.isSearchQuery ? data.answer : data.answer+'<br>'+this.courseUrlList;
        let resObject = {
          index: this.conversion.length + 1,
          question: data.query,
          response: this.apiResData,
          isError: false,
          extraContent: null
        }
        // if (isTeacherAid && this.usertType === 'teacher') {
          // let extraContent = `
          // Here are courses which can help you learn more about this chapter:
          // Misconceptions in Crop Production -  <a href="https://staging.sunbirded.org/explore-course/course/do_21381707533008076811064" target="_blank">https://staging.sunbirded.org/explore-course/course/do_21381707533008076811064</a>
          // Misconceptions in Crop Management - https://staging.sunbirded.org/explore-course/course/do_21381707533008076811064
          // Other resources that you can refer to:
          // Introduction to Crop Production - https://www.youtube.com/watch?v=xR2DPnyLEE0
          // Common misconceptions in Crop Production - https://www.youtube.com/watch?v=8ulpy_GFLDk&t=10s
          // How to mitigate misconceptions - https://www.youtube.com/watch?v=VaDccWJJ864
          // Introduction to Crop Management - https://www.youtube.com/watch?v=NCp93xbSwWM
          // Common misconceptions in Crop Management - https://www.youtube.com/watch?v=zSCR2K81IRo
          // How to mitigate misconceptions - https://www.youtube.com/watch?v=khXPo_QY0B8

          // `;
        //   resObject.extraContent = extraContent
        // }
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

  toGetContentUrl(selChapter, category, QueryData) {
    const url = `https://diksha.gov.in/api/content/v1/search`;
    let request = {
      request: {
        filters: {
          primaryCategory: category
        },
        limit: 10,
        query: selChapter,
        sort_by: {
          "lastPublishedOn": "desc"
        },
        fields: [
          "name",
          "identifier",
          "contentType"
        ],
        softConstraints: {
          "badgeAssertions": 98,
          "channel": 100
        },
        mode: "soft",
        facets: [
          "se_boards",
          "se_gradeLevels",
          "se_subjects",
          "se_mediums",
          "primaryCategory"
        ],
        offset: 0
      }
    }
    return this.http.post(url, request).subscribe((resData: any) => {
      
      this.courseUrlList = '<br>Here are some additional learning materials which can help you learn more about this chapter :' + '<b>' + this.chapterTilte + '</b>',
      // this.courseUrlList.push(reData.courseUrlName);
      resData.result.content.map(dataList => {
        this.courseUrlList =  this.courseUrlList + '<div class="subText">' + '<b>' + dataList?.name + '</b>' + ' <a target="_blank" class="ml-8" href="https://diksha.gov.in/ncert/play/' + dataList?.objectType.toLowerCase() + '/' + dataList?.identifier + '?contentType=' + dataList?.contentType + '">Learn More</a>' + '</div>';
        // console.log(dataList?.name + ':https://diksha.gov.in/ncert/play/' + dataList?.objectType + '/' + dataList?.identifier + '?contentType=' + dataList?.contentType);
        // reData = {
        //   courseUrlName: dataList?.name + ':' + ' <a target="_blank" href="https://diksha.gov.in/ncert/play/' + dataList?.objectType.toLowerCase() + '/' + dataList?.identifier + '?contentType=' + dataList?.contentType + '">Learn More</a>'
        // };
        // this.courseUrlList.push(reData.courseUrlName);
      })
      this.trustedHtml = this.sanitizer.bypassSecurityTrustHtml(this.courseUrlList);
      this.toGetApiResponse(QueryData, this.uuid).subscribe(data => { });
    })
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
  onSubmit($) {
    if (this.selectedOption) {
      this.firstPage = false;
      this.secondPage = true;
      this.chapterTilte = this.selectedOption

    }
  }
  newQuery() {
    this.firstPage = true;
    this.secondPage = false;
    this.showDesc = false;
    this.conversion = [];
  }
  searchBasedQuery() {
    // this.courseUrlList = [];
    this.isSearchQuery = true;
    this.showDesc = true;
    this.firstPage = false;
    this.toGetApiResponse(this.searchQuery, this.uuid).subscribe(data => {
      this.bookDescription = data.answer;
    });
  }
  onFeatureClick(val) {
    this.isSearchQuery = false;
    this.showDesc = true;
    this.firstPage = false;
    if (val === "Quiz") {
      this.courseUrlList = '';
      let Quiz = this.isTeacher ? 'Generate 5 MCQ for this ' + this.chapterTilte : 'As a student, give me 5 MCQ with correct answer for this chapter ' + this.chapterTilte;
      this.toGetContentUrl(this.selectedOption, 'Practice Question Set', Quiz);

      // this.toGetApiResponse(Quiz, this.uuid).subscribe(data => {
      // if (data)
      // });

    }
    else if (val === "Summary") {
      this.courseUrlList = '';
      // this.toGetContentUrl(this.selectedOption, 'Explanation Content')
      let Summary = this.isTeacher ? 'Summarize ' + this.chapterTilte : 'As a student, give me an easy to understand summary of this chapter ' + this.chapterTilte;
      this.toGetContentUrl(this.selectedOption, 'Explanation Content', Summary);


    }
    else if (val === "Material") {
      this.courseUrlList = '';
      // this.toGetContentUrl(this.selectedOption, 'Teacher Resource');
      // this.toGetApiResponse('how to teach ' + this.chapterTilte + ' with activities', this.uuid, true).subscribe(data => {
      // });
      this.toGetContentUrl(this.selectedOption, 'Teacher Resource', 'how to teach ' + this.chapterTilte + ' with activities');

    }
    else if (val === 'importantWords') {
      this.courseUrlList = '';
      // this.toGetContentUrl(this.selectedOption, 'Explanation Content');
      let importantWords = 'Important Words with meaning - As a student, tell me important words about this chapter that I should learn this chapter ' + this.chapterTilte;
      this.toGetContentUrl(this.selectedOption, 'Explanation Content', importantWords);

      // this.toGetApiResponse(importantWords, this.uuid, true).subscribe(data => {
      // });
    }

  }
  transformHTML(data: any) {
    return this.sanitizer.bypassSecurityTrustHtml(data);
  }
}
