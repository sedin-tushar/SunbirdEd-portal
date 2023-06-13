
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, Subscription, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserService } from '@sunbird/core';
import * as _ from 'lodash-es';


@Component({
  selector: 'app-teacher-companion-popup',
  templateUrl: './teacher-companion-popup.component.html',
  styleUrls: ['./teacher-companion-popup.component.scss'],
})
export class TeacherCompanionPopupComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<TeacherCompanionPopupComponent>, private http: HttpClient, private userService: UserService, @Inject(MAT_DIALOG_DATA) public data: any) { }
  firstPage: boolean;
  secondPage: boolean;
  selectedOption: string = '';
  searchQuery: string;
  thirdPage: boolean;
  bookDescription = '';
  chapterTilte = '';
  uuid;
  apiResData = '';
  isLoading: boolean = true;
  userSubscription: Subscription;
  public unsubscribe$ = new Subject<void>();
  userProfile: any;
  userName; any;

  options = [{}];

  texbookIdConfig =
    {
      "do_2135989935565701121331": "4c67c7f4-0919-11ee-9081-0242ac110002"
    }

  ngOnInit() {
    this.options = this.data.children
    this.uuid = this.texbookIdConfig[this.data.identifier];
    this.firstPage = true;
    this.secondPage = false;
    this.thirdPage = false;
    this.getUserDetails()
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

  toGetApiResponse(querParms, uuid): Observable<any> {
    this.isLoading = false;
    const url = `http://4.224.41.213:9000/query-with-langchain-gpt4?uuid_number=${uuid}&query_string=${encodeURIComponent(querParms)}`;
    return this.http.get(url).pipe(
      map((data: any) => {
        this.apiResData = data.answer;
        console.log(this.apiResData);
        this.isLoading = true;
        return data; // Optional: Return the data if needed
      }),
      catchError((error: any) => {
        // Handle the error
        console.error(error);
        this.isLoading = true;
        return throwError(error); // Rethrow the error or return a default value
      })
    );
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
  onSubmit($) {
    console.log('$$$', $);
    this.firstPage = false;
    this.secondPage = true;
    this.chapterTilte = this.selectedOption
    console.log('hi')
  }

  searchBasedQuery() {
    this.thirdPage = true;
    this.firstPage = false;
    this.secondPage = false;
    this.toGetApiResponse(this.searchQuery, this.uuid).subscribe(data => {
      this.bookDescription = data.answer;
    });
    // Handle the search logic here
    console.log('Search query:', this.searchQuery);
  }
  onFeatureClick(val) {
    this.thirdPage = true;
    this.firstPage = false;
    this.secondPage = false;
    if (val === "Quiz") {
      console.log(val)
      let Quiz = 'can you please give me the top 5 question for this ' + this.chapterTilte;
      this.toGetApiResponse(Quiz, this.uuid).subscribe(data => {
        this.bookDescription = data.answer;

      });
    }
    else if (val === "Summary") {
      console.log(val)
      this.toGetApiResponse('Summarize on ' + this.chapterTilte, this.uuid).subscribe(data => {
        this.bookDescription = data.answer;

      });
    }
    else if (val === "Material") {
      console.log(val)
      this.toGetApiResponse('how to teach ' + this.chapterTilte, this.uuid).subscribe(data => {
        this.bookDescription = data.answer;

      });
    }
    // this.bookDescription = "Friction is a force that opposes the relative motion or tendency of such motion between two surfaces in contact with each other. It acts on both surfaces and depends on the nature and smoothness of the surfaces. Friction can be static (when the object is at rest), sliding (when an object is sliding over another), or rolling (when one body rolls over another). Friction is essential for many everyday activities like walking, gripping objects, and stopping vehicles, but it can also cause wear, tear, and energy loss in some situations";

  }
}
