import { Component, OnInit, Input, OnChanges, EventEmitter, Output } from '@angular/core';
import { ExportToCsv } from 'export-to-csv';
import * as _ from 'lodash-es';
import dayjs from 'dayjs';
import {ResourceService} from '../../services/resource/resource.service';
import { Subject } from 'rxjs';
import { TelemetryService } from '@sunbird/telemetry';
import { SbDatatableComponent } from './sb-datatable.component';

describe('SbDatatableComponent', () => {
  let component: SbDatatableComponent;

  const mockResourceService: Partial<ResourceService> = {};
  const mockTelemetryService: Partial<TelemetryService> = {
    interact: jest.fn()
  };

  beforeAll(() => {
    component = new SbDatatableComponent(mockResourceService as ResourceService, mockTelemetryService as TelemetryService)
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize keyUp subscription in ngOnInit', () => {
    jest.spyOn(component.keyUp, 'subscribe')
    component.ngOnInit();
    expect(component.keyUp.subscribe).toHaveBeenCalled();
  });

  it('should apply column filter when onColumnFilter is called', () => {
    component.listFilter = {};
    const key = 'name';
    const value = 'John';
    const testData = [
      { name: 'John', age: 30 },
      { name: 'Alice', age: 25 }
    ];
    component.data = testData;
    component.onColumnFilter(key, value);
    expect(component.listFilter[key]).toEqual(value);
  });

  it('should remove column filter when onColumnFilter is called with empty value', () => {
    const testData = [
      { name: 'John', age: 30 },
      { name: 'Alice', age: 25 }
    ];
    component.data = testData;
    const key = 'name';
    const value = '';
    component.onColumnFilter(key, value);
    expect(component.listFilter[key]).toBeUndefined();
  });

  it('should filter table data based on listFilter when filterDataTable is called', () => {
    const testData = [
      { name: 'John', age: 30 },
      { name: 'Alice', age: 25 }
    ];
    const listFilter = { name: 'John' };
    component.data = testData;
    component.listFilter = listFilter;
    component.filterDataTable();
    expect(component.tableData).toEqual([{ name: 'John', age: 30 }]);
  });

  it('should set tableMessage on ngOnChanges', () => {
    component.message = 'No data available';
    component.ngOnChanges();
    expect(component.tableMessage).toEqual({ 'emptyMessage': 'No data available' });
  });

  it('should initialize filterModel with null values on ngOnChanges', () => {
    const columns = [{ prop: 'name' }, { prop: 'age' }];
    component.columns = columns;
    component.ngOnChanges();
    expect(component.filterModel).toEqual({ 'name': null, 'age': null });
  });

  it('should emit downloadLink event when downloadUrl is called with expired link', () => {
    jest.spyOn(component.downloadLink, 'emit');
    const row = { downloadUrls: ['expiredLink'], expiresAt: new Date('2022-01-01') };
    component.downloadUrl('downloadUrls', row);
    expect(component.downloadLink.emit).toHaveBeenCalledWith(row);
  });

  it('should open window with download link when downloadUrl is called with valid link', () => {
    jest.spyOn(window, 'open');
    const row = { downloadUrls: ['validLink'], expiresAt: new Date('2030-01-01') };
    component.downloadUrl('downloadUrls', row);
    expect(window.open).toHaveBeenCalledWith(row['downloadUrls'][0], '_blank');
  });

  it('should clear searchData when clearSearch is called', () => {
    component.searchData = 'searchTerm';
    component.clearSearch();
    expect(component.searchData).toEqual('');
  });

  it('should set interact event data and call telemetryService.interact when setInteractEventData is called', () => {
    jest.spyOn(component.telemetryService, 'interact');
    component.batch = { courseId: 'course123', batchId: 'batch456' };
    component.setInteractEventData();
    expect(component.telemetryService.interact).toHaveBeenCalled();
  });

  it('should set name and generate CSV when downloadCSVFile is called', () => {
    global.URL.createObjectURL = jest.fn(() => 'details');
    jest.spyOn(ExportToCsv.prototype, 'generateCsv');
    component.name = 'testName';
    component.columns = [{ name: 'Column1' }, { name: 'Column2' }];
    component.tableData = [{ Column1: 'Data1', Column2: 'Data2' }];
    component.downloadCSVFile();
    expect(ExportToCsv.prototype.generateCsv).toHaveBeenCalledWith([{ Column1: 'Data1', Column2: 'Data2' }]);
  });

});
