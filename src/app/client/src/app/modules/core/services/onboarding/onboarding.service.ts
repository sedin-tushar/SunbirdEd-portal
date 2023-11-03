import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private isOnboarding = false;

  setOnboardingStatus(status: boolean) {
    this.isOnboarding = status;
  }

  getOnboardingStatus() {
    return this.isOnboarding;
  }
}
