import { HomePage } from 'src/app/home/home.page';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter } from '@angular/core';


describe('Home Page', () => {
    let homePageSpy: jasmine.SpyObj<HomePage>;
    let homePage: HomePage;
    let fixture: ComponentFixture<HomePage>;

    beforeEach(async () => {
        homePageSpy = jasmine.createSpyObj('HomePage', [
            'showSearch',
            'hideSearch'
        ]);

        await TestBed.configureTestingModule({
            
        });
    });
    
    beforeEach(() => {
        fixture = TestBed.createComponent(HomePage);
        homePage = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the home page', () => {
        expect(homePage).toBeTruthy();
    });

    describe('State change tests', () => {
        it('should toggle search visibility', () => {
            // Initially false
            expect(homePage.isSearchVisible).toBeFalse();
      
            homePage.showSearch();
            expect(homePage.isSearchVisible).toBeTrue();
      
            homePage.hideSearch();
            expect(homePage.isSearchVisible).toBeFalse();
        });
    });
});
