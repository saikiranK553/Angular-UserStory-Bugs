import { Component, OnInit, ElementRef, ViewChild, ViewEncapsulation, Inject, HostListener, OnDestroy, Input, } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription, Observable, Subject } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { A, COMMA, ENTER, P } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent, MatAutocomplete } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { WebsocketService } from '../../appservices/websocket.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import * as XLSX from 'xlsx';

import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/filter';

// Component Imports
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Angular tree module imported
import { TreeComponent, ITreeOptions } from 'angular-tree-component';
import { AppService } from '../../appservices/app.service';
import { UtilsService } from '../../appservices/utils.service';
import { RouteService } from '../../appservices/route.service';
import { MatCheckboxChange } from '@angular/material/checkbox';

declare var _: any;
declare var $: any;

@Component({
	selector: 'app-scripting',
	templateUrl: './scripting.component.html',
	styleUrls: ['./scripting.component.scss'],
	encapsulation: ViewEncapsulation.None,
})

export class ScriptingComponent implements OnInit, OnDestroy {
	@ViewChild('tree') tree: TreeComponent;
	@ViewChild('srPaginator', { static: true }) srPaginator: MatPaginator;
	@ViewChild('rPaginator', { static: true }) rPaginator: MatPaginator;
	@ViewChild('paginator', { static: true }) paginator: MatPaginator;
	// @ViewChild(InterfaceOverrideComponent) private inFcComponent: InterfaceOverrideComponent;
	// @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;
	// Material table
	displayedColumns: string[] = ['select','no', 'name', 'desc','info', 'ttlSc', 'crtOn', 'actions'];
	HistoryColumnName: string[] = ['vNo', 'uName', 'dtCr', 'actions'];
	subRowData = [];
	prMdId = '';
	mModuleId = '';
	allMdId = [];
	filteredSRdata: any;
	rowDataColumns: string[] = ['select', 'no', 'code', 'Lock / Unlock', 'name', 'extnlId', 'ttlSteps', 'actions'];
	rowData: any;
	filteredRdata: any;
	filteredRunPlan: any;
	selection = new SelectionModel<any>(true, []);
	nodes: any;
	prjctData: any;
	authUserData: any;
	authPrjctData: any;
	columnDefs: any;
	subColumnDefs: any;
	showExprtBtn: Boolean = false;
	// rowData: Array<number> = [];
	rowDataSG: Array<number> = [];
	rowDataBG: Array<number> = [];
	// subRowData: Array<number> = [];
	stepDefRowData: any;
	options: ITreeOptions = {
		idField: 'id',
		displayField: 'modNmTc',
		childrenField: 'children',
		nodeHeight: 23,
		useVirtualScroll: true
	};
	cellTemplate: any;
	actvNode: any;
	testCaseModIds: any;
	modLevel: Number;
	testCaseData: any;
	serchModData: any;
	isDisableDel: boolean = true;
	subModData: any;
	closeResult: String;
	isShowStepDefs: boolean = false;
	srchNode: any;
	moduleSearch: any; // Search TestCase Input modelName
	showTcs: boolean = false;
	showScnrio: boolean = false;
	actions: any; // Actions Keywords array
	stepDefData: String; // Module StepDef Data input
	stepChanged: boolean = false;
	submitStep: boolean = false;
	renameType: any; // Rename Step default checkec input true
	// TC Variables Declaration
	newTc: boolean = false;
	// Scenario Section
	scId: String;
	scName: String;
	scDesc: String;
	crntModId: String;
	scAutoId: String;
	extnl_id: String;
	selected_sub_scenarios: any;
	scenariosList:any = [];
	//jiraUrl: String;
	TC_DTP_TestCase_ManualID: String;
	TC_DTP_TestCase_Type: Number = 1;
	TC_DTP_TestCase_Mandatory: Number;
	scSteps: any;
	scTestData: any = [];
	buckList: any = [];
	scTestDataId: any = undefined; // Selected Testdata Id
	scTestDataIdTmp: any = undefined; // Selected Testdata Id for tmp

	scEnvVarId: any = undefined; // Selected Environment Variable Id
	scEnvVarData: any = []; // Environment Variables data
	scEnvLinked: boolean = false; // Env Variable Link check
	scTestBuckDataId: any = undefined; // Selected Test buck data Id

	// StepDef DataStructure
	isStepDefDsbl: boolean = true;
	newTCData = undefined;
	public aStepDefData = [];

	// public req_sc =[];
	public oStepDef: any = {
		keyWordId: undefined,
		sName: undefined,
		token: undefined,
		tcID: undefined,
		stepDefId: undefined,
		keys: [],
		paramValues: undefined,
		config: { "codelock": 0, "namelock": 0, "scriptless": "Y" }
	};
	stepDefColumnDefs: any;
	selectedStepId: any;
	selectedStepIndex: any;
	// StepData Changes
	oldStepData: any;
	oldStepIndex: any;
	stepById: any;
	// Modal StepName and ID
	public modalStepNm: any;
	public modalStepId: any;
	public modalStepIndex: any;
	public modalStepData: any;
	showUpdate: boolean = false;
	deletedTC: any = [];
	deletedTCName: any;
	public dragEvent = new Subscription();
	public breadCrums: any = [];
	showHomeScenario: boolean = false;
	public prevNod: any;
	// Step Params
	stepParamText: any;
	stepHint: any;
	// TestData Check
	isTestData: boolean = false;
	// Edit Step Content
	editStepName: any;
	// editStepEnbl: boolean = false;
	editStepData: any;
	editStepIndex: any;
	// SelectTed Module for Delete
	selectedMod: any;
	// Used TestCases
	usedTCNodes: any;
	// Row index To find index
	rowClicked: Number;
	paramsTextEdit: boolean = false;
	// Function's Respo Variables
	TC_BusinessLine: any;
	businessLineData: any;
	TC_WorkStream: any;
	workStreamData: any;
	TC_Feature: any;
	featureData: any;
	TC_FunctnID: any;
	functionData: any;
	// Loading
	loader: boolean = false;
	loaders: boolean = false;
	checkAll: boolean = false;
	selectedTc: any = [];
	// SubNodes for copy/move
	slctdScnrio: any;
	subNodes1: any = [];
	subNodes2: any = [];
	subNodes3: any = [];
	// Scenario Move/Copy
	scnrioTyp: any = undefined;
	// TCid
	runTcId: any;
	taggdTs: any;
	scTags: any = [];
	// Sceanrio's Categories
	isSG: boolean = false;
	isSGStep: boolean = false;
	isBG: boolean = false;
	sgSteps: Array<number> = [];
	public stepId: any = undefined;
	bddConfig: any = undefined;
	isBDD: boolean = false;
	isNonBDD: boolean = false;
	showTDExcel: boolean = false;
	scTDLinked: boolean = false;
	public td: any = {
		headers: [],
		values: []
	};

	plansrun: any
	showROW: boolean = false;
	delRow: any = [];
	// New Section
	isAllModules: boolean = true;
	// Steps in between
	stpBtwn: Boolean = false;
	stpBtwnIndex: any = undefined;
	steDefSearch: any = new FormControl('');
	routerEvent: Subscription = null;
	// Routes and config
	isScenario: boolean = false;
	isModules: boolean = false;
	isModule: boolean = false;
	// TestRun section
	scSuiteId: any;
	@Input() scReqData: any;
	emitSCResultEvent: Subject<any> = new Subject<any>();

	// lock and Unlock
	isChecked = true;
	scLastMod: any;
	lockSts = 1;
	sc_id: any;
	allowed: Boolean = true;
	canSave: Boolean = false;
	hislist: any;
	VersionList: any;
	version_id: any;
	sc_version_id: "";
	fltrdhistorylist: any;
	textEllipseWidth: any = '150px';
	lockstatus: any;
	prjlist: [];
	mIndex: any = 0;
	allModIndex: any = 0; // All Module Index
	mIndex1: any = 0; // Module Level 1 Index
	mIndex2: any = 0; // Module Level 2 Index  
	mIndex3: any = 0; // Module Level 3 Index
	sIndex: any = 0;
	sIndex0: any = 0; // Module Level 0 Scenario Index
	sIndex1: any = 0; // Module Level 1 Scenario Index
	sIndex2: any = 0; // Module Level 2 Scenario Index
	sIndex3: any = 0; // Module Level 3 Scenario Index

	searchTxMod: any;
	mSearch: any = ''; // All Module Search
	mSearch1: any = ''; // Module Level 1 Search
	mSearch2: any = ''; // Module Level 2 Search  
	mSearch3: any = ''; // Module Level 3 Search
	searchTxSc: any;
	sSearch0: any = ''; // Module Level 0 Scenario Search
	sSearch1: any = ''; // Module Level 1 Scenario Search
	sSearch2: any = ''; // Module Level 2 Scenario Search  
	sSearch3: any = ''; // Module Level 3 Scenario Search
	mLength: any = 0;
	sLength: any = 0;
	tooltipJson = { '1': 'INITIATED', '2': 'SCHEDULED', '3': 'PREPARATION', '4': 'PRERUN', '5': 'RUNNING', '6': 'PRECOMPLETE', '7': 'COMPLETED', '9': 'CANCELLED', '10': 'ERROR' };
	// Action keywords in lowercase stored
	actionKeys: Array<string> = [];
	updateSc: any;
	isAllValuesFills: boolean = true;
	scTimer: any;
	theadVisible: any = 'visible';

	selectedRows: any[] = [];
	filterscenario: any[];
	selectedItems: any[] = [];
	isPopUpOpen: boolean = false;
	constructor(private utils: UtilsService, public appService: AppService, private wss: WebsocketService,
		public router: Router, public urlParam: ActivatedRoute, public rs: RouteService, private _modal: MatDialog) {

		this.actvNode = undefined;

		this.authUserData = JSON.parse(localStorage.getItem('rt-AuthUser'));
		if (localStorage.getItem('rt-UserProject') !== undefined) {
			this.authPrjctData = localStorage.getItem('rt-UserProject');
		};

		this.routerEvent = this.router.events.subscribe((event: any) => {
			if (event instanceof NavigationEnd) {
				if (_.contains(event.url.split('/'), undefined))
					return window.history.back();
				if (!_.contains(event.url.split('/'), 'scenario')) {
					if (_.contains(event.url.split('/'), 'modules')) {
						this.isModule = false;
						this.isModules = true;
						this.isScenario = false;
					} else {
						this.isModule = true;
						this.isModules = false;
						this.isScenario = false;
					};
				} else {
					this.isScenario = true;
					this.isModule = false;
					this.isModules = false;
				}
			};
		});

		this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
			const navigation = this.router.getCurrentNavigation();
			let pgParams;
			if (!navigation.extras?.replaceUrl && navigation.extras?.state && navigation.extras.state?.pgParams)
				pgParams = navigation.extras.state.pgParams
			if (navigation.extras?.replaceUrl && navigation.previousNavigation != null
				&& navigation.previousNavigation.extras?.state && navigation.previousNavigation.extras.state?.pgParams)
				pgParams = navigation.previousNavigation.extras.state.pgParams;

			if (pgParams != undefined && !_.isEmpty(pgParams)) {
				pgParams = JSON.parse(pgParams);

				this.allModIndex = pgParams.m0;
				this.mIndex1 = pgParams.m1;
				this.mIndex2 = pgParams.m2;
				this.mIndex3 = pgParams.m3;

				this.sIndex0 = pgParams.s0;
				this.sIndex1 = pgParams.s1;
				this.sIndex2 = pgParams.s2;
				this.sIndex3 = pgParams.s3;

				this.mSearch = pgParams.mS0;
				this.mSearch1 = pgParams.mS1;
				this.mSearch2 = pgParams.mS2;
				this.mSearch3 = pgParams.mS3;

				this.sSearch0 = pgParams.sS0;
				this.sSearch1 = pgParams.sS1;
				this.sSearch2 = pgParams.sS2;
				this.sSearch3 = pgParams.sS3;
			}

		});

		// StepDef search by name with debounceTime will wait for 300ms till stops entering value
		this.steDefSearch.valueChanges.pipe(
			map((value: any) => value),
			filter((res: any) => {
				if (res && !_.isEmpty(res))
					return true;
				else {
					this.aStepDefData = [];
					this.isSGStep = false;
				};
			}),
			debounceTime(800),
			distinctUntilChanged()
		).subscribe(res => { if (res && res.length > 0) this.getStepDefByName(res) });

	}

	@HostListener('scroll', ['$event'])
	onTableScroll(event: any) {
		if (event['srcElement'].scrollTop > 75)
			this.theadVisible = 'hidden';
		else
			this.theadVisible = 'visible';
	}

	ngOnInit() {

		this.scTimer = setInterval(() => {
			if (this.scLastMod != undefined && this.scLastMod != null) {
				var dtMod: any = new Date(this.scLastMod);
				var curDate: any = new Date();
				var diffMins: any = Math.floor((curDate - dtMod) / (1000 * 60));
				if (diffMins > 5) {
					if (this.scId != undefined && this.scId != null) {
						this.appService.postData('/scenario/idleTimeOutLock', { scId: this.scId })
							.subscribe(res => {
								if (res.data !== null && res.error === null) {
									this.getScenarioById(this.scId);
									this.utils.setToast('success', res.data, 'Success');
								} else
									this.utils.setToast('error', res.error, 'Error');

							});
					}
					if (this.testCaseModIds != undefined && this.testCaseModIds != null)
						this.getModuleDataById(this.testCaseModIds);
				} else {
					this.appService.postData('/scenario/updateTime', { scId: this.scId })
						.subscribe(res => {
							if (res.error !== null)
								this.utils.setToast('error', res.error, 'Error');
						});
				}
			}
		}, 5 * 60 * 1000);

		this.authUserData = JSON.parse(localStorage.getItem('rt-AuthUser'));
		if (localStorage.getItem('rt-UserProject') !== undefined) {
			this.authPrjctData = JSON.parse(localStorage.getItem('rt-UserProject'));
			if (_.findWhere(this.authPrjctData.keyFormat, { name: 'BDD', status: 1 })) {
				this.isBDD = true;
			};
			if (_.findWhere(this.authPrjctData.keyFormat, { name: 'NON_BDD', status: 1 })) {
				this.isNonBDD = true;
			};
		}
		// this.getTreeData();
		$('[data-toggle="tooltip"]').tooltip();
		this.urlParam.params.subscribe(params => {
			if (this.isModules)
				this.getAllModules();
			if (this.isModule && !_.isEmpty(params)) {
				this.crntModId = params['modId'];
				this.getModuleDataById(params['modId']);
			};
			if (this.isScenario && !_.isEmpty(params)) {
				this.scId = params['scId'];
				this.getScenarioById(params['scId']);
			};

		});
	};

	onPaginateChange(event, pageName) {
		
		if (!_.isEmpty(pageName) && pageName === 'M') {
			this.selection.clear();
			if (this.modLevel == 0)
				this.mIndex1 = event.pageIndex;
			else if (this.modLevel == 1)
				this.mIndex2 = event.pageIndex;
			else if (this.modLevel == 2)
				this.mIndex3 = event.pageIndex;
			else {
				this.allModIndex = event.pageIndex;
				this.getAllModules();
			}
		}

		if (!_.isEmpty(pageName) && pageName === 'S') {
			if (this.modLevel == 1)
				this.sIndex1 = event.pageIndex;
			else if (this.modLevel == 2)
				this.sIndex2 = event.pageIndex;
			else if (this.modLevel == 3)
				this.sIndex3 = event.pageIndex;
			else
				this.sIndex0 = event.pageIndex;
		}
	}
	
	// =========================== New Section ========

	// filter submodule
	myFilterMod(searchTxMod, mIndex) {
		this.selection.clear();
		this.searchTxMod = searchTxMod;
		if (this.modLevel == 0) {
			this.mSearch1 = searchTxMod;
			this.mIndex1 = mIndex;
			this.myFilterSubModule(this.searchTxMod);
		} else if (this.modLevel == 1) {
			this.mSearch2 = searchTxMod;
			this.mIndex2 = mIndex;
			this.myFilterSubModule(this.searchTxMod);
		} else if (this.modLevel == 2) {
			this.mSearch3 = searchTxMod;
			this.mIndex3 = mIndex;
			this.myFilterSubModule(this.searchTxMod);
		} else {
			this.mSearch = searchTxMod;
			this.allModIndex = mIndex;
			setTimeout(() => {
				this.getAllModules();
			}, 500);
		}
	}

	myFilterSubModule(searchTxMod) {
		if (searchTxMod && searchTxMod.length > 0) {
			const pl = _.filter(this.subRowData, e => ((e.name).toLowerCase()).includes(searchTxMod.toLowerCase()));
			this.mLength = pl.length;
			this.filteredSRdata = new MatTableDataSource(pl);
		} else {
			this.searchTxMod = '';
			this.filteredSRdata = new MatTableDataSource(this.subRowData);
			this.mLength = this.subRowData.length;
		}
		this.mIndex = this.modLevel == 0 ? this.mIndex1 :
			this.modLevel == 1 ? this.mIndex2 : this.modLevel == 2 ? this.mIndex3 :
				this.allModIndex;
		this.srPaginator.pageIndex = this.mIndex;
		this.filteredSRdata.paginator = this.srPaginator;
	}

	// Filter Scenario
	myFilterScenario(searchTxSc, sIndex) {
		this.searchTxSc = searchTxSc;
		if (this.modLevel == 1) {
			this.sSearch1 = searchTxSc;
			this.sIndex1 = sIndex;
		} else if (this.modLevel == 2) {
			this.sSearch2 = searchTxSc;
			this.sIndex2 = sIndex;
		} else if (this.modLevel == 3) {
			this.sSearch3 = searchTxSc;
			this.sIndex3 = sIndex;
		} else {
			this.sSearch0 = searchTxSc;
			this.sIndex0 = sIndex;
		}
		if (searchTxSc && searchTxSc.length > 0) {
			const pl = _.filter(this.rowData, e => ((e.name).toLowerCase()).includes(searchTxSc.toLowerCase()));
			this.filteredRdata = new MatTableDataSource(pl);
			this.sLength = pl.length;
		} else {
			this.searchTxSc = '';
			this.sLength = this.rowData.length;
			this.filteredRdata = new MatTableDataSource(this.rowData);
		}
		this.sIndex = this.modLevel == 0 ? this.sIndex0 :
			this.modLevel == 1 ? this.sIndex1 : this.modLevel == 2 ? this.sIndex2 :
				this.modLevel == 3 ? this.sIndex3 : 0;
		this.rPaginator.pageIndex = this.sIndex;
		this.filteredRdata.paginator = this.rPaginator;
	}

	// Back to Modules section
	backToModule() {
		window.history.back();
	}

	// Get All Modules by ProjectID
	getAllModules() {
		this.scLastMod = null;
		this.mIndex = this.allModIndex;
		this.searchTxMod = this.mSearch;
		let reqParam = {
			searchTx: this.searchTxMod,
			pIndex: this.mIndex
		}
		this.appService.getByData('/modulesByProjectId', reqParam)
			.subscribe(result => {
				if (result.data) {
					this.isAllModules = true;
					this.actvNode = undefined;
					this.showScnrio = false;
					this.testCaseModIds = null;
					// Scenarios Data
					this.rowData = [];
					this.filteredRdata = new MatTableDataSource(_.clone(this.rowData));
					this.filteredRdata.paginator = undefined;
					// Modules Data
					this.subRowData = result.data.list;
					// if (!_.isEmpty(this.searchTxMod))
					// 	this.myFilterMod(this.searchTxMod, this.mIndex);
					// else {
					this.mLength = result.data.length;
					this.filteredSRdata = _.clone(this.subRowData);
					this.srPaginator.pageIndex = this.mIndex;
					this.filteredSRdata.paginator = this.srPaginator;
					// }
				};
			});
	};
	// Drag Eventer Material
	drop(event: CdkDragDrop<any[]>) {
		moveItemInArray(this.stepDefRowData, event.previousIndex, event.currentIndex);
		if (event.previousIndex !== event.currentIndex)
			// this.saveDraggedSteps(this.stepDefRowData)
			this.saveDraggedSteps2(event.currentIndex, event.previousIndex)
	}
	// Create new Module
	saveNewMod(crtMod) {
		crtMod.mod_prntId = this.testCaseModIds ? this.testCaseModIds : 0;
		crtMod.modLevel = this.modLevel ? this.modLevel : 0;
		crtMod.prMdId = this.prMdId;
		crtMod.allMdId = this.allMdId;
		crtMod.mModuleId = this.mModuleId;
		this.appService.postData('/save/newModule', crtMod).subscribe(res => {
			if (!_.isEmpty(res.data)) {
				this.utils.setToast('success', 'Successfully created', 'Success');
				// this.subRowData.splice(0, 0, res.data);
				// _.map(this.subRowData, (md, i) => md.sNo = i + 1);
				// this.filteredSRdata = new MatTableDataSource(this.subRowData);
				// this.filteredSRdata.paginator = this.srPaginator;
				if(res.data.modLevel===0){
					this.getAllModules();
				}else{
					this.subRowData.splice(0, 0, res.data);
					_.map(this.subRowData, (md, i) => md.sNo = i + 1);
					this.filteredSRdata = new MatTableDataSource(this.subRowData);
					this.filteredSRdata.paginator = this.srPaginator;
				}
			} else {
				this.utils.setToast('error', 'New Module cannot saved', 'Error');
			}
		}, err => {
			if (err.status === 409) {
				this.utils.setToast('warning', 'Module name already exists', 'Duplicate');
			}
		});
	};
	// Module Name click
	onModNameClick(params) {
		var pgParams = JSON.stringify({
			m0: this.allModIndex, m1: this.mIndex1, m2: this.mIndex2, m3: this.mIndex3,
			s0: this.sIndex0, s1: this.sIndex1, s2: this.sIndex2, s3: this.sIndex3,
			mS0: this.mSearch, mS1: this.mSearch1, mS2: this.mSearch2, mS3: this.mSearch3,
			sS0: this.sSearch0, sS1: this.sSearch1, sS2: this.sSearch2, sS3: this.sSearch3
		});
		this.router.navigate(['index/module', params._id], { state: { pgParams } });
	};
	// Get Modules Data by Module Id
	getModuleDataById(id) {
		this.rowData = [];
		let data: any;
		let data1: any;
		this.filteredRdata = data1;
		this.subRowData = [];

		this.filteredSRdata = data;

		this.selection.clear();
		this.testCaseModIds = id;
		this.showScnrio = false;
		this.isDisableDel = false;
		this.isAllModules = false;
		this.appService.getData(`/modulebyid/${id}`).subscribe((res: any) => {
			if (!_.isEmpty(res.data) && res.data.length > 0) {
				this.actvNode = res.data[0];
				//this.jiraUrl = this.actvNode.jiraurl;
				this.prMdId = this.actvNode.prMdId;
				this.mModuleId = this.actvNode.mModuleId;
				this.allMdId = this.actvNode.allMdId;
				// Scenarios Data
				this.rowData = this.actvNode.scenarios;
				this.modLevel = this.actvNode.modLevel;
				this.sIndex = this.modLevel == 0 ? this.sIndex0 :
					this.modLevel == 1 ? this.sIndex1 : this.modLevel == 2 ? this.sIndex2 :
						this.modLevel == 3 ? this.sIndex3 : 0;
				this.searchTxSc = this.modLevel == 0 ? this.sSearch0 :
					this.modLevel == 1 ? this.sSearch1 : this.modLevel == 2 ? this.sSearch2 :
						this.modLevel == 3 ? this.sSearch3 : '';
				if (!_.isEmpty(this.searchTxSc))
					this.myFilterScenario(this.searchTxSc, this.sIndex);
				else {
					this.sLength = this.rowData.length;
					this.filteredRdata = new MatTableDataSource(_.clone(this.rowData));
					this.rPaginator.pageIndex = this.sIndex;
					this.filteredRdata.paginator = this.rPaginator;
				}

				// Sub Modules data
				// _.map(this.actvNode.subModules, (eSm, i) => eSm.sNo = i + 1);
				this.mIndex = this.modLevel == 0 ? this.mIndex1 :
					this.modLevel == 1 ? this.mIndex2 : this.modLevel == 2 ? this.mIndex3 :
						this.allModIndex;
				this.searchTxMod = this.modLevel == 0 ? this.mSearch :
					this.modLevel == 1 ? this.mSearch1 : this.modLevel == 2 ? this.mSearch2 :
						this.modLevel == 3 ? this.mSearch3 : '';
				this.subRowData = _.clone(this.actvNode.subModules);
				// if (!_.isEmpty(this.searchTxMod))
				// 	this.myFilterMod(this.searchTxMod, this.mIndex);
				// else {
				this.mLength = this.subRowData.length;
				this.filteredSRdata = new MatTableDataSource(this.subRowData);
				this.srPaginator.pageIndex = this.mIndex;
				this.filteredSRdata.paginator = this.srPaginator;
				//}
			}
		});
	}

	handleSelection(event: MatCheckboxChange, row: any): void {
		this.isPopUpOpen = false;

		if (!event.checked) {
			this.appService.selectedItems = [];
		}
		const index = this.selectedRows.findIndex(selectedRow => selectedRow === row);
		if (index === -1) {
			this.selectedRows.push(row);
		} else {
			this.selectedRows.splice(index, 1);
		}
	}


	openSubScenario(){				
		const dialogRef =  this._modal.open(ModalDialogComponent, {
			width: '50%',
			panelClass: ['overflow-auto'],
			data: {
				scenariosList: this.scenariosList,
				type: 'MODSCE',
				headerName: "Scenario's"
			}
		});
		
		dialogRef.afterClosed().subscribe(() => {
			this.isPopUpOpen = true && (this.appService.selectedItems.length != 0); 
		});
		this.isPopUpOpen = false;
	}

	Scenariopoplist( event: MatCheckboxChange,id) {		
		this.isPopUpOpen = false;		
		if( event.checked ) {
			this.appService.getData(`/modulebyid/${id}`).subscribe((res: any) => {
				this.scenariosList = res.data[0].scenarios;
			}); 
		}
	}

	ExportToProject() {
		const dialogRef = this._modal.open(ModalDialogComponent, {
			minWidth: '640px',
			height: '290px',
			data: {
				type: 'EXTPRO',
				headerName: "Projects"
			}
		})
		dialogRef.afterClosed().subscribe(result => {

		});
	}

	// Open Modal For Create new Module
	openSubModCreate(mod) {
		const dialogRef = this._modal.open(ModalDialogComponent, {
			minWidth: '640px',
			height: '290px',
			data: {
				type: 'NEWMOD',
				mode: mod ? 'EDIT' : 'CREATE',
				name: mod ? mod.name : null,
				desc: mod ? mod.desc : null,
				id: mod ? mod._id : null,
				headerName: mod ? 'Modify Module' : 'Create Module',
			}
		})
		dialogRef.afterClosed().subscribe(result => {
			if (result.data == undefined && result.name.replace(/ {2,}/g, ' ').trim().length > 0) {
				if (result && mod && !_.isEmpty(mod)) {
					if (mod.name === result.name && mod.desc === result.desc)
						return
					let reqData = {
						modId: mod._id,
						modName: (result.name).replace(/ {2,}/g, ' ').trim(),
						modDesc: result.desc,
						modLevel: this.modLevel ? this.modLevel : 0,
						prMdId: this.prMdId,
						allMdId: this.allMdId,
					}
					this.appService.postData('/set/updateModuleData', reqData)
						.subscribe(res => {
							if (!res.error && res.data)
								this.utils.setToast('success', res.data, 'Success');
							if (this.isModule)
								this.getModuleDataById(this.testCaseModIds);
							if (this.isModules)
								this.getAllModules();
						}, err => {
							if (err.status === 409) {
								this.utils.setToast('warning', 'Module name already exists', 'Duplicate');
							}
						});
				} else {
					if (result && result.name) {
						result.name = result.name ? (result.name).trim() : '';
						this.saveNewMod(result);
					}
				};
			}

		});
	};
	// Delete Module
	onDeleteModule(node) {
		if ((node.subModules && node.subModules.length > 0) || Number(node.totalSC) > 0) {
			this.utils.setToast('warning', 'Cannot Delete module which has <b>Sub Modules</b> or <b>Scenarios</b>', 'Warning');
			return
		} else {
			const dialogRef = this._modal.open(ModalDialogComponent, {
				width: '500px',
				autoFocus: false,
				disableClose: true,
				data: {
					type: 'DELETE',
					msg: node.name
				}
			})
			dialogRef.afterClosed().subscribe(result => {

				if (result.type == 'DELETE') {
					this.appService.postData('/delete/selectedModule', { _id: node._id }).subscribe(res => {
						if (!res.error && !_.isEmpty(res.data)) {
							this.utils.setToast('success', "Successfully Deleted", 'Success');
							// this.subRowData = _.without(this.subRowData, _.findWhere(this.subRowData, { _id: node._id }));
							// _.map(this.subRowData, (m, i) => m.sNo = i + 1);
							// this.filteredSRdata = new MatTableDataSource(this.subRowData);
							// this.filteredSRdata.paginator = this.srPaginator;
							if(this.router.url.includes("modules")){
								this.getAllModules();
							}else{
								this.subRowData = _.without(this.subRowData, _.findWhere(this.subRowData, { _id: node._id }));
								_.map(this.subRowData, (m, i) => m.sNo = i + 1);
								this.filteredSRdata = new MatTableDataSource(this.subRowData);
								this.filteredSRdata.paginator = this.srPaginator;
							}
						} else
							this.utils.setToast('error', res.error, 'Error');
					});
				};
			});
		};
	}

	importExcel() {
		const dialogRef = this._modal.open(ModalDialogComponent, {
			width: `50%`,
			height: 'auto',
			autoFocus: false,
			disableClose: true,
			hasBackdrop: true,
			data: {
				type: 'IMPORT EXCEL',
				headerName: 'Import Scenario Using Excel',
			}
		})
		dialogRef.afterClosed().subscribe(result => {
			this.getAllModules();
		});
	};

	// Create new Scenario
	importScenario() {
		this.appService.getData('/scenario/getIssueType').subscribe(res => {
			if (res.data.err) {
				this.utils.setToast('error', 'No issue/work item type to display', 'ERROR')
			} else {
				if (!_.isEmpty(res.data)) {
					this._modal.open(ModalDialogComponent, {
						width: '900px',
						data: {
							type: 'IMPRTSC',
							scId: null,
							issueTypeList: res.data,
							headerName: "Import Scenario"
						}
					}).afterClosed().subscribe((cres: any) => {
						if (!_.isEmpty(cres) && cres.length > 0) {
							let imprtModData = [];
							_.each(cres, (val) => {
								imprtModData.push({
									name: val.summary ? val.summary : "",
									desc: val.description ? val.description : "",
									itemId: val.id ? val.id : "",
									extnl_id: val.key ? val.key : "",
									workitemurl: val.workitemurl ? val.workitemurl : "",
									mod_id: this.testCaseModIds,
									code: this.authPrjctData.code
								});
							});
							this.appService.postData('/save/saveNewSceUsingImport', imprtModData).subscribe((res) => {
								if (!_.isEmpty(res.data)) {
									this.utils.setToast('success', 'Imported successfully', 'Success');
									this.getModuleDataById(this.testCaseModIds);
								}
							});
						}
					});
				} 
				else
					this.utils.setToast('info', "No issue or work item type available to import scenario", 'Info');
			}
		});
	}

	setScenario() {
		this.selection.clear();
		let tagList = [];
		this.appService.postData('/tags/list', {}).subscribe(res => {
			let resData = res.data;
			//	if (res.data && resData[0]?.config.length > 0) {
			tagList = resData[0]?.config;

			this._modal.open(ModalDialogComponent, {
				width: '800px',
				height: '500px',
				data: {
					type: 'NEWSC',
					mode: 'CREATE',
					name: null,
					desc: null,
					tagList,
					headerName: 'Create Scenario',
				}
			}).afterClosed().subscribe((res: any) => {
				if (!_.isEmpty(res.name)) {
					const reqObj = {
						name: (res.name).replace(/ {2,}/g, ' ').trim(),
						desc: res.desc,
						modId: this.testCaseModIds,
						code: this.authPrjctData.code,
						otherId: res?.otherId,
						configId: res?.configId,
						dpdnt_sc: res?.dpdnt_sc,
						req_sc: res?.req_sc,
						//subStatus: res?.subStatus
					};

					this.appService.postData('/save/saveTestCase', reqObj)
						.subscribe(res => {
							if (!_.isEmpty(res.data)) {
								this.utils.setToast('success', 'Successfully created', 'Success')
								// Scenarios Data
								// res.data.sNo = this.actvNode.scenarios.length + 1;
								this.actvNode.scenarios.splice(0, 0, res.data);
								_.map(this.actvNode.scenarios, (e, i) => e.sNo = i + 1);
								this.rowData = this.actvNode.scenarios;
								this.filteredRdata = new MatTableDataSource(_.clone(this.rowData));
								this.filteredRdata.paginator = this.rPaginator;
								var pgParams = JSON.stringify({
									m0: this.allModIndex, m1: this.mIndex1, m2: this.mIndex2, m3: this.mIndex3,
									s0: this.sIndex0, s1: this.sIndex1, s2: this.sIndex2, s3: this.sIndex3,
									mS0: this.mSearch, mS1: this.mSearch1, mS2: this.mSearch2, mS3: this.mSearch3,
									sS0: this.sSearch0, sS1: this.sSearch1, sS2: this.sSearch2, sS3: this.sSearch3
								})
								setTimeout(() => {
									if (res.data._id !== 'undefined' && res.data._id != undefined)
										this.router.navigateByUrl(`index/module/${res.data.mod_id}/scenario/${res.data._id}`, { state: { pgParams } })
								}, 1500)
							};
						}, err => {
							if (err.status === 409) {
								this.utils.setToast('warning', `${err.error.err}`, 'Duplicate');
							}
						});
				};
			});
			//}
		})
	};
	// Update Scenario Name and Desc
	updateTcForm(sc, indx) {
		let tagList = [];
		this.appService.postData('/tags/list', {}).subscribe(res => {
			let resData = res.data;
			if (res.data && resData[0]?.config.length > 0) {
				tagList = resData[0]?.config;
			}
			this._modal.open(ModalDialogComponent, {
				width: '800px',
				height: '500px',
				data: {
					type: 'NEWSC',
					mode: 'EDIT',
					tagList: tagList,
					name: sc.name ? (sc.name).replace(/ {2,}/g, ' ').trim() : '',
					desc: sc.desc,
					sc,
					otherId: sc.config ? sc.config.otherId : '',
					selectedTags: sc.sc_tags,
					aDeptSceData: sc.config ? sc.config.dpdnt_sc : '',
					aReqData: sc.config ? sc.config.req_sc : '',
					headerName: 'Modify Scenario',
				}
			}).afterClosed().subscribe((result: any) => {
				if (this.testCaseModIds == undefined) {
					this.urlParam.params.subscribe(params => {
						this.testCaseModIds = params['modId'];
					});
				}

				if (result && !_.isEmpty(result.name)) {
					/* if ((sc.name === result.name) && (sc.desc === result.desc))
						return */
					let reqData = {
						tcName: (result.name).replace(/ {2,}/g, ' ').trim(),
						tcId: sc._id,
						tcDesc: result.desc,
						otherId: result?.otherId,
						tcTagId: result?.configId,
						dpdnt_sc: result?.dpdnt_sc,
						req_sc: result?.req_sc,
						modId: this.testCaseModIds,
						//subStatus: result?.subStatus
					};
					this.appService.postData('/update/updateTestCase', reqData)
						.subscribe(res => {
							if (indx != undefined) {
								this.getModuleDataById(this.testCaseModIds);
								if (!res.error && res.data) {
									this.getScenarioById(result.sc._id);
									this.actvNode.scenarios[indx].name = result.name;
									this.actvNode.scenarios[indx].desc = result.desc;
									this.rowData = this.actvNode.scenarios;
									this.filteredRdata = new MatTableDataSource(_.clone(this.rowData));
									this.filteredRdata.paginator = this.rPaginator;
									this.utils.setToast('success', 'Successfully updated', 'Success');
								} else {
									if (res.error)
										this.utils.setToast('error', `${res.error}`, 'Error');
									else
										this.utils.setToast('error', 'Not Updated, Try again', 'Not Updated');
								}
							} else {
								this.getScenarioById(result.sc._id);
								this.utils.setToast('success', 'Successfully updated', 'Success');
							}

						}, err => {
							if (err.status === 409) {
								this.utils.setToast('warning', `${err.error.err}`, 'Duplicate');
							}
						});
				}
			});
		})
	};

	jiraUpdate(ele) {
		this._modal.open(ModalDialogComponent, {
			width: '600px',
			height: '236px',
			data: {
				type: 'UPDATEEXTNLID',
				mode: 'UPDATEEXTNLID',
				ele,
				headerName: 'EXTERNAL ID',
			}
		}).afterClosed().subscribe((result: any) => {
			this.getModuleDataById(this.testCaseModIds);
		})
	}

	// Scenario Name click
	onScNameClick(params) {

		var pgParams = JSON.stringify({
			m0: this.allModIndex, m1: this.mIndex1, m2: this.mIndex2, m3: this.mIndex3,
			s0: this.sIndex0, s1: this.sIndex1, s2: this.sIndex2, s3: this.sIndex3,
			mS0: this.mSearch, mS1: this.mSearch1, mS2: this.mSearch2, mS3: this.mSearch3,
			sS0: this.sSearch0, sS1: this.sSearch1, sS2: this.sSearch2, sS3: this.sSearch3
		});

		if (params.mod_id && params._id && params._id != 'undefined' && params._id != undefined)
			this.router.navigateByUrl(`index/module/${params.mod_id}/scenario/${params._id}`, { state: { pgParams } });
		else
			return this.utils.setToast('warning', 'Invalid URL Data. Please check with ModuleId or ScenarioId', 'INVALID');

	};

	// Get Scneario Data
	getScenarioById(id) {
		this.appService.postData('/getStepDefForTestCaseID', { tcId: id })
			.subscribe(result => {
				if (!result.error && !_.isEmpty(result.data)) {
					this.updateSc = result.data[0];
					this.scName = result.data[0].name;
					this.scDesc = result.data[0].desc;
					this.scAutoId = result.data[0].sCode; // Auto generate Code
					this.extnl_id = !_.isEmpty(result.data[0].config) ? result.data[0].config.extnl_id : null; // External key
					this.scTestDataId = (result.data[0].testdata_id && result.data[0].testdata_id !== "") ? result.data[0].testdata_id : null;
					this.scEnvVarId = result.data[0]?.envvar_id;
					this.scEnvLinked = result.data[0]?.envvar_id ? true : false;
					this.scTDLinked = (result.data[0].testdata_id && result.data[0].testdata_id !== "") ? true : false;
					// this.td.headers = (result.data[0].headers && result.data[0].headers.length > 0) ? result.data[0].headers : [];
					// this.td.values = (result.data[0].values && result.data[0].values.length > 0) ? result.data[0].values : [];
					//this.getTestData();
					this.scTags = result.data[0].tagsData === 'null' ? [] : result.data[0].tagsData;
					if (!(_.isEmpty(result.data[0].tcSteps))) {
						this.stepDefRowData = this.nameResolveParams(result.data[0].tcSteps);
						this.scSteps = this.stepDefRowData;
					} else
						this.stepDefRowData = [];
					this.allowed = result.data[0].lockSts == 1 ? true : false;
					this.isChecked = result.data[0].lockSts == 1 ? true : false;
					this.scLastMod = result.data[0].dtMod;
				}
			})
		this.getStepDef('oldTc');
		this.showUpdate = true;
	}
	// Get TestData for scenario
	//  Call After Scenario Saved
	getTestData() {
		this.appService.postData('/getTestData', { type: 'TD', dataType: 'DFLT' })
			.subscribe(res => {
				if (res.data.data && res.data.data.length > 0)
					this.scTestData = res.data.data;
				else {
					if (this.scTDLinked)
						this.utils.setToast('warning', 'Create New', 'No TestData Found')
				}

			}, error => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
			});
	};

	// On Delete Scenario
	onScenarioDelete(params: any) {
		const dialogRef = this._modal.open(ModalDialogComponent, {
			width: '500px',
			autoFocus: false,
			disableClose: true,
			data: {
				type: 'DELETE'
			}
		})
		dialogRef.afterClosed().subscribe(result => {
			if (result.type) {
				let reqData = {
					scIds: [params._id],
					token: this.authUserData.token
				};
				this.appService.postData('/deleteTestCase', reqData)
					.subscribe(res => {
						if (!_.isEmpty(res.data.msg)) {
							this.getModuleDataById(this.testCaseModIds);
							return this.utils.setToast('warning', res.data.msg, 'INVALID');
						}
						if (res.data !== null && res.error === null) {
							if (res.data.code !== undefined && (res.data.data && res.data.data.length > 0)) {
								this._modal.open(ModalDialogComponent, {
									width: '500px',
									autoFocus: false,
									disableClose: true,
									data: {
										type: 'SHOWSC',
										scs: res.data.data
									}
								})
							} else {
								this.utils.setToast('success', 'Successfully deleted', 'Success');
								this.rowData = _.without(this.rowData, _.findWhere(this.rowData, { _id: params._id }));
								this.actvNode.scenarios = this.rowData;
								_.map(this.rowData, (m, i) => m.sNo = i + 1);
								this.filteredRdata = new MatTableDataSource(this.rowData);
								this.filteredRdata.paginator = this.rPaginator;
							};
						} else
							return this.utils.setToast('error', res.error, 'Error');
					}, error => this.utils.setToast('error', 'Internal Server Error', 'Error'));
			}
		});
	};
	// Copy Scenario
	copyScnrio() {
		this.appService.getByData('/modulesByProjectId', {}).subscribe(result => {
			if (!_.isEmpty(result.data)) {
				this._modal.open(ModalDialogComponent, {
					width: '750px',
					data: {
						type: 'COPYSC',
						nodes: _.clone(result.data.list),
						headerName: 'Select Module'
					}
				}).afterClosed().subscribe((res) => {
					if (!_.isEmpty(res.slctdScnrio))
						this.moveToMod(res.mode, res.slctdScnrio);
				})
			}
		});
	}

	//Export scenario 
	exprtScnrio() {
		let scConfig = _.compact(_.flatten(_.pluck(this.selection.selected, 'config')))
		let ckJk = _.isEmpty(_.compact(_.flatten(_.pluck(scConfig, 'extnl_id')))) ? true : false;
		if (ckJk) {
			this.appService.getData('/scenario/getIssueType').subscribe(res => {
				if (res.data.err) {
					this.utils.setToast('error', 'No issue/work item type to display', 'ERROR')
				} else {
					this._modal.open(ModalDialogComponent, {
						width: '500px',
						data: {
							type: 'CWI',
							issueTypeList: res.data,
							headerName: 'Choose Issue / Work Item Type'
						}
					}).afterClosed().subscribe((result) => {
						if (!_.isEmpty(result)) {
							this.appService.postData('/scenario/export', { scId: _.pluck(this.selection.selected, '_id'), issueType: result })
								.subscribe(res => {
									if (res.data.err) {
										this.utils.setToast('error', res.data.err, 'ERROR')
									} else if (_.isEmpty(res.data)) {
										this.utils.setToast('error', 'Scenario(s) not exported', 'ERROR')
									} else {
										this.getModuleDataById(this.testCaseModIds);
										this.utils.setToast('success', 'Export successfully', 'SUCCESS')
									}
								}, err => this.utils.setToast('error', err.error.err, 'Error'));
						}
					});
				}
			});
		} else {
			this.utils.setToast('info', `Can't export scenario which is mapped with external key. Please uncheck and export again.`, 'INFO');
		}
	}

	// Copy scenario to selected module
	moveToMod(mode, slctdScnrio) {
		let tcVal = [];
		_.each(this.selection.selected, (val) => {
			tcVal.push({ tcId: val._id, name: val.name, sCode: val.sCode })
		})
		let requestngObj = {
			mod_id: slctdScnrio,
			tcIds: _.pluck(this.selection.selected, '_id'),
			type: mode,
			tcVal: tcVal,
			code: this.authPrjctData.code
		};
		if (String(this.actvNode._id) === String(requestngObj.mod_id) && mode === 'move') {
			this.utils.setToast('warning', 'You are not allowed to move to the same module.', 'NOT-ALLOWED');
			return
		};
		this.appService.postData('/update/moveTestCase', requestngObj)
			.subscribe(res => {
				if (res.error === null) {
					this.utils.setToast('success', 'Changes Updated', 'UPDATED');
					this.selection.clear();
					this.getModuleDataById(this.testCaseModIds);
				} else {
					if (res.error)
						this.utils.setToast('error', res.error, 'Error');
					else
						this.utils.setToast('warning', 'Something went wrong. Please try again later.', 'NOT-UPDATED');
				};
			}, error => this.utils.setToast('danger', 'Internal Server Error', 'ERROR'));
	};

	// Test Run section
	testRun() {
		this.appService.getData(`/suitebyname/SC-${this.scId}`).subscribe(res => {
			if (!res.data && !res.err)
				this.createSuiteForScLevel(); // note: If no testsuites found this will create temp suite for scenario
			if (res.data && !res.err) {
				this.scSuiteId = res.data._id;
				this.runPlansModal(this.scSuiteId);
			}
		})
		// this.router.navigateByUrl(`index/runplansummary/sc/${this.scId}`);
	};

	// Create Suite for Scenario level
	createSuiteForScLevel() {
		let reqObj: any = {
			type: 'create',
			tcIds: [this.scId],
			totaltTcs: 1,
			tsName: `SC-${this.scId}`,
			tsDes: `Scenario level Suite SC-${this.scId}`,
			code: this.authPrjctData.code,
			mode: 'SC'
		};
		this.appService.postData('/saveTestSuite', reqObj)
			.subscribe(res => {
				this.scSuiteId = res.data._id;
				this.runPlansModal(this.scSuiteId);
			}, (err) => {
				if (err.status === 409) {
					this.utils.setToast('warning', `${err.error.err}`, 'Duplicate');
					return
				} else {
					this.utils.setToast('error', 'Internal Server Error', 'ERROR');
				};
			});
	}
	// Runplans Modal
	runPlansModal(scSuiteId) {
		this.appService.postData('/runPlanList', { type: "SC" })
			.subscribe((res) => {
				this._modal.open(ModalDialogComponent, {
					width: '750px',
					maxHeight: '95%',
					data: {
						type: 'R-PLANS',
						plans: _.filter(res.data, f => Number(f.schdlConfCount) <= 2),
						// plans: res.data,	
						scSuiteID: scSuiteId,
						scId: this.scId,
						headerName: 'Choose Run Plan'
					}
				}).afterClosed().subscribe(res => {
					if (res.data) {
						this.scReqData = { type: 'TEST', runId: this.scId };
						this.emitSCResultEvent.next(this.scReqData);
					}
				})
			}, (err) => {
				this.utils.setToast('error', 'ERROR', "Internal Server Error");
			});
	}

	// Tab Change Event
	tabChange(event) {
		this.stpBtwnIndex === undefined;
		if (event === 1) {
			//this.testDataChange(this.scTestDataId);
			this.getTestData();
			if (this.scTestDataId != null && (_.isEmpty(this.scTestBuckDataId) || this.scTestBuckDataId == 'DEFAULT'))
				this.getTestDataByBuckIds(this.scTestDataId);
			else {
				this.appendBuckData(this.scTestBuckDataId);
			}
		}
		if (event === 2) {
			this.scReqData = { type: 'TEST', runId: this.scId };
			this.emitSCResultEvent.next(this.scReqData);
		}
		if (event === 3) {
			this.historytab();
		}
	};


	// Open Modal For View TestCase list
	viewTcModal(subModModal) {
		// Temp Comment
	}
	// get StepDefs For TestCases
	getStepDef(keyParam) {
		if (keyParam === 'newTc') {
			this.scName = '';
			this.scId = undefined;
			this.scDesc = '';
			this.scAutoId = '';
			this.TC_DTP_TestCase_ManualID = '';
			this.TC_DTP_TestCase_Type = 1;
			this.TC_DTP_TestCase_Mandatory = 0;
			this.scSteps = [];
			this.newTc = true;
			this.stepDefData = undefined;
			this.stepDefRowData = [];
			this.aStepDefData = [];
			this.showUpdate = false;
			this.isTestData = false;
			this.scTestDataId = null;
		} else {
			this.newTc = false;
			this.authUserData.keys = _.pluck(this.authPrjctData.keyFormat, 'name');
			this.appService.getByData('/get/getActionKeywords', this.authUserData).subscribe(res => {
				if (res.data && res.data.length > 0 && !res.error) {
					this.actions = res.data;
					for (var i = 0; i < res.data.length; i++) {
						if (this.scSteps && this.scSteps.length > 0) {
							for (var j = 0; j < this.scSteps.length; j++) {
								if (this.scSteps[j].keyWordId === res.data[i].DTP_Keyword_ID) {
									this.scSteps[j].kName = res.data[i].content;
								};
							};
							this.actionKeys.push(res.data[i].content ? res.data[i].content.toLowerCase() : '');
						} else
							break;
					}
				} else {
					this.utils.setToast('warning', 'No <strong>BDD</strong> Keys found', 'No Data');
					this.actions = [];
				};
			});
		};
		$('html, body, #scrllr').animate({ scrollTop: 0 }, 100);
		$("#scrllr").animate({ scrollTop: 0 }, "fast");
	};

	// GetStepDef By Text while onChange
	getStepDefByName(stepDef) {
		if (stepDef) {
			this.aStepDefData = [];
			//if (!_.contains(['#', '*', '@'], stepDef.toLowerCase())) {
			if (!stepDef.includes('@')) {
				this.isSGStep = false;
				let reqData = {
					text: undefined,
					type: 'steps'
				};
				let splittedStep = stepDef.split(' ');
				// const lowCase = _.map(this.actions, e => e.content.toLowerCase());
				if (splittedStep[0] && _.contains(this.actionKeys, splittedStep[0].toLowerCase()))
					stepDef = stepDef.slice(splittedStep[0].length + 1);
				if (stepDef.match(/@PARAM(|\w+)/gi)) {
					reqData.text = stepDef.replace(/@PARAM(|\w+)/g, '').trim();
				} else {
					reqData.text = stepDef.trim();
				};
				if ((reqData.text && reqData.text.length > 1) && (reqData.text && reqData.text.length <= 20)) {
					this.appService.postData('/stepDefByName', reqData)
						.subscribe(res => {
							if (res.data !== null && res.error === null) {
								this.aStepDefData = res.data;
								this.stepChanged = false;
							} else {
								this.aStepDefData = [];
								this.stepChanged = true;
							}
						});
				};
			} else {
				this.isSGStep = true;
				if (stepDef.toLowerCase().startsWith('@') && !_.isEmpty(stepDef)) {
					const reqData = {
						text: stepDef,
						category: 'SG'
					};
					if ((reqData.text && reqData.text.length > 2) && (reqData.text && reqData.text.length <= 20)) {
						this.appService.postData('/get/testCasesByText/', reqData)
							.subscribe(res => {
								this.aStepDefData = res.data;
							}, error => {
								this.utils.setToast('error', 'Internal Server Error', 'ERROR');
							});
					} /* else if (stepDef.toLowerCase().startsWith('@') && (reqData.text && reqData.text.length == 1)) {
						//reqData.text = '@';
						this.appService.getDataByTxt('/get/testCasesByText/', reqData)
							.subscribe(res => {
								this.aStepDefData = res.data;
							}, error => {
								this.utils.setToast('error', 'Internal Server Error', 'ERROR');
							});
					} */
					else {
						this.aStepDefData = [];
						this.isSGStep = false;
					}
				}
				/* else {
					this.aStepDefData = [];
					this.isSGStep = false;
				}; */
			};
		} else {
			this.aStepDefData = [];
			this.isSGStep = false;
		};
	}
	// Action Change function
	actnChng(action, index) {
		let reqObj = {
			tcId: this.scId,
			//tcId: this.newTCData._id,
			token: this.authUserData.token,
			stepIndex: index,
			actionId: action._id
		};
		this.appService.postData('/update/action', reqObj)
			.subscribe((res) => {
				if (res.data !== null && res.error === null) {
					let mtchdData = _.findWhere(this.actions, { _id: action._id });
					if (mtchdData) {
						this.stepDefRowData[index].kName = mtchdData.content;
						this.stepDefRowData[index].keyWordId = action._id;
						this.utils.setToast('success', 'Action key successfully updated', 'Success');
					};
				};
			});
	}



	// Delete Step
	deleteStep(step, index) {
		const dialogRef = this._modal.open(ModalDialogComponent, {
			width: '420px',
			autoFocus: false,
			disableClose: true,
			data: {
				type: 'DELETE'
			}
		})
		dialogRef.afterClosed().subscribe(result => {
			if (result.type) {
				let reqObj = {
					tcId: undefined,
					token: this.authUserData.token,
					stepId: step.stepDefId,
					stepIndex: index,
					type: 'SC'
				};
				if (this.scId)
					reqObj.tcId = this.scId;
				else
					reqObj.tcId = this.newTCData.DTP_TestCase_ID;
				this.appService.postData('/removestep', reqObj)
					.subscribe((res) => {
						if (res.data !== null && res.error === null) {
							if (res.status !== 201) {
								this.stepDefRowData = [..._.reject(this.stepDefRowData, (e, index) => { return index === reqObj.stepIndex })];
								this.utils.setToast('success', 'Step removed successfully', 'Success');
							}
						} else {
							this.utils.setToast('error', res.error, 'Error')
						}
					}, error => this.utils.setToast('error', error.statusCode, 'ERROR'));
			};
		});
	}

	// Move Step Up | Down
	moveStep(index, direction) {
		const prevIndx = index;
		let exstRowData = this.stepDefRowData;
		let prevStep = _.filter(exstRowData, (f, i) => i === index);
		let rjctdStp = _.reject(exstRowData, (s, i) => i === index);
		index = (direction === 'up') ? index - 1 : index + 1;
		rjctdStp.splice(index, 0, prevStep[0]);
		this.stepDefRowData = rjctdStp;
		this.saveDraggedSteps2(index, prevIndx);
	}

	// StepDef submit Function
	submitStepDef(reqParams, reqType: String) {
		let isComment: boolean = false;
		let actionWord = [];
		if (_.isString(reqParams) && reqParams.toLowerCase().startsWith('@') && !reqParams.toLowerCase().startsWith('@param')) {
			this.utils.setToast('warning', 'You can only choose step group', 'Warning');
			return
		};
		if (this.isSG && reqParams.ctgry === 'SG' && reqType === 'SG') {
			this.utils.setToast('warning', `You cannot add Grouped scenario's in Step Group`, 'Warning');
			$('#stepDefContainer').val('');
			this.stepDefData = '';
			return
		};
		if (!reqType) {
			if (_.isString(reqParams)) {
				if (reqParams && reqParams.match(/"|\w+"/)) {
					let dupStep = reqParams.replace(/"|\w+"/g, '');
					if (dupStep === '' || dupStep.length == 0) {
						this.utils.setToast('warning', 'Cannot add step without name', 'Warning');
						return
					}
				}
				if (reqParams.toLowerCase().startsWith('and')
					|| reqParams.toLowerCase().startsWith('given')
					|| reqParams.toLowerCase().startsWith('when')
					|| reqParams.toLowerCase().startsWith('then')
					|| reqParams.toLowerCase().startsWith('but')) {
					actionWord = reqParams.split(" ");
				} else
					actionWord = [];
				if (reqParams.toLowerCase().startsWith('#') || reqParams.toLowerCase().startsWith('*') || reqParams.toLowerCase().startsWith('@') && !reqParams.toLowerCase().startsWith('@param')) {
					isComment = true;
				};
				this.oStepDef.stepType = reqParams.toLowerCase().startsWith('#') ? 'C' : reqParams.toLowerCase().startsWith('*') ? 'A' : 'SD';
				this.oStepDef.sName = reqParams.replace(/#|\*/gi, '').trim();
			}
		} else {
			if (reqType === 'onlyStep') {
				if (this.stepDefData.toLowerCase().startsWith('and')
					|| this.stepDefData.toLowerCase().startsWith('given')
					|| this.stepDefData.toLowerCase().startsWith('when')
					|| this.stepDefData.toLowerCase().startsWith('then')
					|| this.stepDefData.toLowerCase().startsWith('but')) {
					actionWord = this.stepDefData.split(" ");
				}
				this.oStepDef.stepType = reqParams.type;
			} else {
				this.oStepDef.stepType = 'SG';
				this.oStepDef.id = reqParams._id;
				isComment = true;
			}
		};
		// this.oStepDef.sName.split(/\s*(\([^(]*\))\s*/).filter(Boolean)
		if (!isComment) {
			if (reqType === 'onlyStep') {
				if (actionWord[0] && !_.isEmpty(actionWord[0])) {
					const aKey = _.find(this.actions, fA => fA.content.toLowerCase() === actionWord[0].toLowerCase());
					this.oStepDef.keyWordId = aKey ? aKey._id : null;
				} else {
					if (this.stepDefRowData && this.stepDefRowData.length > 0) {
						const aKey = _.find(this.actions, fA => fA.content.toLowerCase() === 'and');
						this.oStepDef.keyWordId = aKey ? aKey._id : null;
					} else {
						const aKey = _.find(this.actions, fA => fA.content.toLowerCase() === 'given');
						this.oStepDef.keyWordId = aKey ? aKey._id : null;
					};
				};
			} else {
				for (var i = 0; i < this.actions.length; i++) {
					if (actionWord[0] && actionWord[0].length > 0) {
						if (actionWord[0].toLowerCase() === this.actions[i].content.toLowerCase()) {
							let matchdParams = []
							this.oStepDef.keyWordId = this.actions[i]._id;
							this.oStepDef.sName = reqParams.slice(actionWord[0].length + 1).trim();
							if (this.oStepDef.sName.match(/"|\w+"/)) {
								this.oStepDef.sName = this.oStepDef.sName.replace(/"([^""]*)"/g, '{_$1_}');
							};
							if (this.oStepDef.sName.match(/@PARAM/i)) {
								this.oStepDef.sName = this.oStepDef.sName.replace(/@PARAM/gi, '');
							};
							if (this.oStepDef.sName.match(/{"\w+"}/) || this.oStepDef.sName.match(/{|\w+}/) || this.oStepDef.sName.match(/\(|\w+\)/)) {
								// matchdParams = this.oStepDef.sName.split(/\s*({[^{]*})\s*/).filter(Boolean);
								matchdParams = this.oStepDef.sName.split(/\s*(\([^(]*\))\s*/).filter(Boolean)
								if (matchdParams && matchdParams.length > 0) {
									this.oStepDef.paramValues = [];
									matchdParams = _.map(matchdParams, (each, index) => {
										if (!(each.match(/\(|\w+\)/))) {
											let tEach = each.replace(/\s\s+/g, ' ')
											this.oStepDef.paramValues.push(tEach);
										} else {
											this.oStepDef.paramValues.push(each.trim());
										}
									});
								}
							} else {
								this.oStepDef.paramValues = [];
							}
							this.oStepDef.stepDefId = undefined;
							break;
						}
					} else {
						let matchdParams = [];
						if (this.oStepDef.sName.match(/"|\w+"/)) {
							this.oStepDef.sName = this.oStepDef.sName.replace(/"([^""]*)"/g, '{_$1_}');
						};
						if (this.oStepDef.sName.match(/@PARAM/i)) {
							this.oStepDef.sName = this.oStepDef.sName.replace(/@PARAM/gi, '');
						};
						this.oStepDef.stepDefId = undefined;
						this.oStepDef.sName = this.oStepDef.sName.replace(/""/g, '');
						this.oStepDef.sName = this.oStepDef.sName.replace(/{}/g, '');
						if (this.oStepDef.sName.match(/{"\w+"}/) || this.oStepDef.sName.match(/{|\w+}/) || this.oStepDef.sName.match(/\(|\w+\)/)) {
							// matchdParams = this.oStepDef.sName.split(/\s*({[^{]*})\s*/).filter(Boolean);
							matchdParams = this.oStepDef.sName.split(/\s*(\([^(]*\))\s*/).filter(Boolean);
							if (matchdParams && matchdParams.length > 0) {
								this.oStepDef.paramValues = [];
								matchdParams = _.each(matchdParams, (each) => {
									// if (!(each.match(/{|\w+}/))) {
									if (!(each.match(/\(|\w+\)/))) {
										let tEach = each.replace(/\s\s+/g, ' ')
										this.oStepDef.paramValues.push(tEach);
									} else {
										this.oStepDef.paramValues.push(each.trim());
									}
								});
							}
						} else
							this.oStepDef.paramValues = [];

						if (this.scId !== undefined)
							this.oStepDef.tcID = this.scId;
						else
							this.oStepDef.tcID = this.newTCData.DTP_TestCase_ID;
						if (this.stepDefRowData && this.stepDefRowData.length === 0) {
							if (this.actions[i].content.toLowerCase() === 'given') {
								if (reqParams.keyWordId && reqParams.keyWordId !== undefined)
									this.oStepDef.keyWordId = reqParams.keyWordId;
								else
									this.oStepDef.keyWordId = this.actions[i]._id;
								break;
							}
						} else {
							if (this.actions[i].content.toLowerCase() === 'and') {
								if (reqParams.keyWordId && reqParams.keyWordId !== undefined)
									this.oStepDef.keyWordId = reqParams.keyWordId;
								else
									this.oStepDef.keyWordId = this.actions[i]._id;
								break;
							}
						}
					}
				}
			}
		} else {
			this.oStepDef.stepDefId = undefined;
			if (this.scId !== undefined)
				this.oStepDef.tcID = this.scId;
			else
				this.oStepDef.tcID = this.newTCData.DTP_TestCase_ID;
			this.oStepDef.paramValues = [];
			this.oStepDef.keyWordId = null;
		};
		if (this.oStepDef && this.oStepDef != undefined) {
			if (this.scId !== undefined)
				this.oStepDef.tcID = this.scId;
			else
				this.oStepDef.tcID = this.newTCData.DTP_TestCase_ID;

			if (reqType === 'onlyStep') {
				this.oStepDef.config = reqParams.config;
				this.oStepDef.stepDefId = reqParams._id;
				this.oStepDef.paramValues = reqParams.paramValues;
				this.oStepDef = _.omit(this.oStepDef, 'sName', 'keys', 'stepParamValues', 'stepDesc');
			};
			if (reqType !== 'onlyStep' && this.oStepDef.paramValues && this.oStepDef.paramValues.length > 0 && this.oStepDef.sName.match(/\(|\w+\)/)) {
				this.oStepDef.sName = this.oStepDef.paramValues.join(" ").trim();
			};
			this.oStepDef.stpBtwnIndex = this.stpBtwnIndex + 1;

			if ('stpSts' in this.oStepDef || this.oStepDef?.stpSts !== 1) {
				this.oStepDef.stpSts = parseInt('0');
			}
			this.appService.postData('/save/saveStepDef', this.oStepDef)
				.subscribe(res => {
					if (res.data !== null && res.error === null) {
						this.stepDefData = '';
						if (this.oStepDef.stpBtwnIndex) {
							this.stepDefRowData.splice(this.oStepDef.stpBtwnIndex, 0, this.nameResolveParams(res.data[0].tcSteps)[0]);
							this.stepDefRowData = [...this.stepDefRowData];
						} else {
							this.stepDefRowData = [...this.stepDefRowData, this.nameResolveParams(res.data[0].tcSteps)[0]];
						};

						this.oStepDef.paramValues = [];
						this.oStepDef.stpBtwnIndex = undefined;
						this.oStepDef.keys = [];
						this.stepChanged = false;
						this.aStepDefData = [];
						$('html, body, #scrllr').animate({ scrollTop: $('#scrllr')[0].scrollHeight }, 100);
						this.stpBtwnIndex = undefined;
					} else if (res.data === null && res.error !== null) {
						this.utils.setToast('warning', res.error.msg, 'Warning')
						return
					} else {
						this.utils.setToast('error', 'Unknown error please contact administrator', 'Error');
						return
					}
				}, error => {
					this.oStepDef.keyWordId = '';
					this.oStepDef.sName = '';
					this.oStepDef.stepDefId = '';
					this.oStepDef.keys = [];
					this.oStepDef.paramValues = undefined;
					$('html, body, #scrllr').animate({ scrollTop: $('#scrllr')[0].scrollHeight }, 100);
					if (error.status === 409) {
						this.utils.setToast('warning', 'Already Used', 'Duplicate');
						return
					} else {
						this.utils.setToast('error', error.statusCode, 'Error');
						return
					};
				});
		}
	};

	// CheckTCType // Type is Data or Static
	// checkTCType() {
	// 	let paramFound = false;
	// 	if (this.stepDefRowData && this.stepDefRowData.length > 0) {
	// 		_.each(this.stepDefRowData, (each, index) => {
	// 			if (each.paramValues && each.paramValues.length > 0) {
	// 				_.each(each.paramValues, (eachL) => {
	// 					if (eachL.paramType === 'DATA') {
	// 						this.TC_DTP_TestCase_Type = 2;
	// 						paramFound = true;
	// 					} else if (eachL.paramType === 'LOC' || eachL.paramType === 'STATIC') {
	// 						this.TC_DTP_TestCase_Type = 1;
	// 					};
	// 				});
	// 			} else
	// 				this.TC_DTP_TestCase_Type = 1;
	// 		});
	// 	} else
	// 		this.TC_DTP_TestCase_Type = 1;
	// 	if (paramFound) {
	// 		this.TC_DTP_TestCase_Type = 2;
	// 	} else {
	// 		this.TC_DTP_TestCase_Type = 1;
	// 	};
	// 	return this.TC_DTP_TestCase_Type;
	// }
	// Its uses only index numbers
	saveDraggedSteps2(crntIndx, prevIndx) {
		const reqData = {
			tcId: this.newTCData ? this.newTCData : this.scId,
			crntIndx: crntIndx,
			prevIndx: prevIndx,
			token: this.authUserData.token,
			type: 'SC'
		}
		this.appService.postData('/update/updateTestCaseSteps', reqData)
			.subscribe((res) => {
				if (res.data !== null && res.error === null) {
					this.utils.setToast('success', 'Steps Order changed', 'Success');
				} else if (res.error) {
					this.utils.setToast('error', res.error, 'Error');
				};
			}, error => {
				this.utils.setToast('error', error.statusCode, 'Error');
			});
	}

	// optionSubmit
	optionSubmit(step, type: String) {	// Using on AutoComplete triggered at (MouseClick, and Entered)
		this.submitStepDef(step, `${type !== null ? type : 'onlyStep'}`);
	};

	// Clear Step Modal Content
	closeStpC() {
		this.editStepName = '';
		this.editStepData = [];
		this.editStepIndex = undefined;
	}

	// NameResolve Function for params values and its Sort Id
	public nameResolveParams(stepDef) {
		_.map(stepDef, (each, index) => {
			if (each.paramValues) {
				each.splittedName = [];
				let splittedNameArray = [];
				if (each.sName) {
					if (each?.sName.match(/@PARAM/gi) || each?.sName.match(/@DATA/gi)) {
						splittedNameArray = each.sName.replace(/@PARAM|@DATA/gi, '').split(/\s*(\([^\(]*\))\s*/).filter(Boolean);
					} else {
						splittedNameArray = each.sName.split(/\s*(\([^\(]*\))\s*/).filter(Boolean);
					};
					if (splittedNameArray.length > 0) {
						let pos = 0;
						_.each(splittedNameArray, (eachSplitted, splitIndex) => {
							let tempObj: any = {
								type: undefined,
								val: undefined,
								key: undefined,
								paramType: undefined,
								prmPos: undefined
							};
							if (eachSplitted.match(/\(\w+\)/)) {
								_.map(each.paramValues, (eachParam) => {
									for (let paramKey in eachParam) {
										if (eachSplitted.replace(/[()]/g, '') === String(paramKey)) {
											if (eachParam[String(paramKey)] === '') {
												tempObj.type = 'placeholder';
												if (each.ParamValues && each.ParamValues.length > 0) {
													each.ParamValues = JSON.parse(each.ParamValues);
													tempObj.val = eachParam[String(paramKey)];
												} else {
													_.each(each.stepParamValues, (eachStpPrm) => {
														if (_.contains(_.keys(eachStpPrm), String(paramKey))) {
															if (_.isEmpty(eachStpPrm[String(paramKey)])) {
																if (eachStpPrm['hint'] && eachStpPrm['hint'].match(/\\/g)) {
																	tempObj.val = eachStpPrm['hint'].replace(/\//g, '');
																} else {
																	tempObj.val = eachStpPrm['hint'];
																}
																tempObj.key = String(paramKey);
															} else {
																tempObj.val = eachStpPrm[String(paramKey)];
																tempObj.key = String(paramKey);
															}
														};
													});
												}
											} else {
												tempObj.type = 'hint';
												if (eachParam[paramKey.toString()] && eachParam[paramKey.toString()].match(/\\/g)) {
													tempObj.val = String(eachParam[paramKey.toString()].replace(/\\/g, ''));
												} else {
													tempObj.val = String(eachParam[paramKey.toString()]);
												};
												tempObj.paramType = eachParam.paramType;
												tempObj.type = 'static';
												if (eachParam.paramType.toLowerCase() === 'loc') {
													tempObj.locNm = eachParam.locNm;
													tempObj.configNm = eachParam.configNm;
												};
												tempObj.key = paramKey.toString();
											};
										};
									};
								});
								pos = pos + 1; // Params Position only if @param variables
								tempObj.prmPos = pos;
								each.splittedName.push(tempObj);
							} else {
								tempObj.type = 'text';
								tempObj.val = eachSplitted;
								each.splittedName.push(tempObj);
							}
						});
					}
				}
			};
			each.sortId = index + 1;
			return each;
		});
		return stepDef;
	}
	// Redirect to StepDef page with StepId
	editOldStep(step) {
		this.router.navigate(['index/steps', step.stepDefId]);
		// this.actionComp.getName(step.stepDefId, undefined);
	}
	// Check TestData Exist while in Edit Mode
	// checkTestData() {
	// 	if (this.isTestData) {
	// 		this.utils.setToast('warning', 'Cannot change ScenarioType <b>TestData</b> present in steps', 'Warning')
	// 		return
	// 	}
	// }

	// Open TC from stepdef : To view TestCase
	viewTestCase(reqObj) {
	}
	// Upload Scenario
	upldScnrs(uploadModal) {
		// Temporary Commented
		// this.scnrioFile = 'Upload Scenario Data';
	}

	// View tagged test case details
	viewTaggedTs(ts) {
		let tcID = {
			tcId: ts._id
		}
		this.appService.postData('/getTaggedTs', tcID)
			.subscribe(res => {
				if (res.error !== null && res.data === null) {
					this.utils.setToast('warning', res.error, 'Warning');
				} else {
					this.taggdTs = res.data;
					this._modal.open(ModalDialogComponent, {
						width: '750px',
						data: {
							type: 'TAGGEDTS',
							taggdTs: res.data,
							headerName: 'Scenario Used by',
						}
					});
				};
			});
	};

	// Add tags
	// viewTags(scId) {
	// 	this.appService.postData('/getTagsByScId', { tcId: this.scId, token: this.authUserData.token })
	// 		.subscribe(res => {
	// 			if (res.data && res.data.length > 0) {
	// 				this.scTags = res.data;
	// 			}
	// 		}, error => {
	// 			this.utils.setToast('danger', error.statusCode, 'ERROR');
	// 		});
	// }
	// View Stepgroup Steps
	viewSGsteps(params) {
		let reqObj = {
			token: this.authUserData.token,
			tcId: params.sgId
		};
		this.appService.postData('/getStepDefForTestCaseID', reqObj)
			.subscribe(result => {
				if (result.error === null && result.data) {
					if (result.data && result.data.length > 0) {
						if (!(_.isEmpty(result.data[0].tcSteps))) {
							this.sgSteps = this.nameResolveParams(result.data[0].tcSteps);
							this._modal.open(ModalDialogComponent, {
								width: '650px',
								data: {
									type: 'SGSTEPS',
									SGsteps: this.sgSteps,
									headerName: 'Steps'
								}
							})
						}
					}
				}
			});
	};
	// Scneario type change (BDD or Non-BDD)
	// groupChng() {
	// 	this.utils.setToast('warning', 'You cannot change this later', 'Changed');
	// }

	// TestData Change in scenario
	async testDataChange(testDataId: any) {
		if (testDataId) {
			if (!this.scTDLinked) {
				this.getTestDataByIds(testDataId);
				// _.filter(this.scTestData,  (ef: { _id: any; data: { headers: any; }[]; buckList: any; }) => {
				// 	if (String(ef._id) === String(testDataId)) {
				// 		this.td.values = [];
				// 		this.showTDExcel = true;
				// 		this.td.headers = ef.data[0].headers ? ef.data[0].headers : [];
				// 		let newVals = [];
				// 		 _.each(ef.data[0].headers, hdr => newVals.push(''));
				// 		this.td.values.push(newVals);
				// 		this.buckList = ef.buckList ? ef.buckList : [];
				// 	};
				// });
			};
		} else {
			this.td.headers = [];
			this.td.values = [];
		};
	};

	appendBuckData(testDataId) {
		this.appService.postData('/getTestData', { testDataId: (testDataId != 'DEFAULT') ? testDataId : this.scTestDataId, type: 'TD', isFilter: "Y", sCode: this.scAutoId })
			.subscribe(res => {
				if (res.data && res.data.length > 0 && res.data[0].data && res.data[0].data.length > 0) {
					let data = res.data[0];
					this.td.headers = data.data[0].headers;
					this.td.values = data.data[0].values;
					this.scTestDataIdTmp = (testDataId != 'DEFAULT') ? testDataId : undefined;
				} else {
					this.utils.setToast('info', 'TestData not found', 'NO-DATA');
				};
			}, error => {
				this.utils.setToast('error', error.statusCode, 'ERROR')
			});
	}

	getTestDataByIds(testDataId) {
		this.appService.postData('/getTestData', { testDataId: testDataId, type: 'TD', isFilter: "Y", sCode: this.scAutoId })
			.subscribe(res => {
				if (res.data && res.data.length > 0 && res.data[0].data && res.data[0].data.length > 0) {
					let data = res.data[0];
					this.td.values = [];
					this.showTDExcel = true;
					this.td.headers = data.data[0].headers ? data.data[0].headers : [];
					let newVals = [];
					_.each(data.data[0].headers, hdr => newVals.push(''));
					this.td.values.push(newVals);
					//this.buckList = data.buckList ? data.buckList : [];

				} else {
					this.utils.setToast('info', 'TestData not found', 'NO-DATA');
				};
			}, error => {
				this.utils.setToast('error', error.statusCode, 'ERROR')
			});
	}

	getTestDataByBuckIds(testDataId) {
		this.appService.postData('/getTestData', { testDataId: testDataId, type: 'TD', isFilter: "Y", sCode: this.scAutoId })
			.subscribe(res => {
				if (res.data && res.data.length > 0) {
					let data = res.data[0];
					this.buckList = data.buckList ? data.buckList : [];
					if (res.data[0].data && res.data[0].data.length > 0) {
						this.showTDExcel = true;
						this.scTDLinked = true;
						this.td.headers = data.data[0].headers;
						this.td.values = data.data[0].values;
					} else {
						this.showTDExcel = false;
						this.scTDLinked = false;
						this.td.headers = [];
						this.td.values = [];
					}
				} else {
					this.utils.setToast('info', 'TestData not found', 'NO-DATA');
				};
			}, error => {
				this.utils.setToast('error', error.statusCode, 'ERROR')
			});
	}

	// Testdata changes tracking
	customTrack(index, item) {
		return index;
	};
	// Link test data to scenario
	linkTestData(testDataId) {
		this.scTestDataId = testDataId;
		const filtrdTDdata = _.find(this.scTestData, { _id: testDataId });
		if (filtrdTDdata) {
			let reqData = {
				id: testDataId,
				tdType: 'TD',
				type: 'update',
				isSClink: true,
				scLinkType: 'LINK',
				tcId: this.scId,
				scCode: this.scAutoId
			};
			this.appService.postData('/settestdata', reqData)
				.subscribe(res => {
					if (!res.err && res.data) {
						// this.td.headers = res.data.headers;
						// this.td.values = res.data.values;
						//this.scTDLinked = true;
						this.showTDExcel = true;
						this.appService.postData('/gettestdata', { testDataId: testDataId, type: "TD", isFilter: "Y", sCode: this.scAutoId })
							.subscribe(res => {
								if (!res.err && res.data) {
									this.td.headers = res.data[0].data[0].headers;
									this.td.values = res.data[0].data[0].values;
									this.scTDLinked = true;
									this.buckList = res.data[0].buckList;
								}
							});
						this.utils.setToast('success', 'Testdata has been mapped to your scenario', 'Added');
					} else
						this.utils.setToast('warning', 'Please Try Again later', 'Not Updated');
				});
		}
	};
	removeTestData() {
		const dialogRef = this._modal.open(ModalDialogComponent, {
			width: '500px',
			data: {
				type: 'TD'
			}
		});
		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				let reqData = {
					id: this.scTestDataId,
					tdType: 'TD',
					type: 'update',
					isSClink: true,
					scLinkType: 'UNLINK',
					scCode: this.scAutoId,
					tcId: this.scId
				};
				this.appService.postData('/settestdata', reqData)
					.subscribe(res => {
						if (!res.err && res.data) {
							this.td.headers = [];
							this.td.values = [];
							this.scTestDataId = undefined;
							this.showTDExcel = false;
							this.scTDLinked = false;
							this.getScenarioById(this.scId);
							return this.utils.setToast('info', 'Testdata has been removed from scenario', 'REMOVED');
						} else
							return this.utils.setToast('warning', 'Please Try Again later', 'NOT-UPDATED')
					});
			};
		});
	};
	// Link and Unlink Environment Data
	linkEnvData(envId, type) {
		this.appService.postData('/setenvdata', { tcId: this.scId, env_id: type === 'add' ? envId : null })
			.subscribe(res => {
				if (!res.err && res.data) {
					this.scEnvLinked = type === 'add' ? true : false;
					this.scEnvVarId = type === 'add' ? envId : null;
					this.utils.setToast('success', 'Environment Variable Updated', type === 'add' ? 'Added' : 'Removed');
				} else
					this.utils.setToast('warning', 'Please Try Again later', 'Not Updated');
			});
	}
	// Manage TestData
	updateScTestData(reqData: any, type) {
		this.appService.postData('/setSCTestData', reqData)
			.subscribe(res => {
				if (res.error === null && res.data !== null) {
					if (type === 'add') {
						this.showTDExcel = true;
						this.scTDLinked = true;
					} else {
						this.scTestDataId = undefined;
						this.showTDExcel = false;
						this.scTDLinked = false;
						reqData.token = this.authUserData.token;
					};
				} else {
					this.utils.setToast('error', 'Please try again later', 'ERROR')
				};
			}, error => this.utils.setToast('error', 'Internal Server Error', 'ERROR'));
	};

	// Adding New Values for Params
	addValue(paramValues, paramIndex, paramKey, stepDefId, stepIndex, stepVal, type, prmPos) {
		let paramDataType;
		if (!this.scTestDataId && type.toLowerCase() === 'data') {
			return this.utils.setToast('warning', 'Testdata not Found! Please Add Test Data', 'Not Found');
		};
		if (type.toLowerCase() === 'data')
			paramDataType = 'NONE';
		const dialogRef = this._modal.open(ModalDialogComponent, {
			width: '50%',
			data: {
				tcId: this.scId,
				tcCode: this.scAutoId,
				type: 'PARAMS',
				paramType: type,
				paramDataType: paramDataType,
				stepId: stepDefId,
				stepIndex: stepIndex,
				stepVal: stepVal ? stepVal : '',
				testdata_id: this.scTestDataId ? this.scTestDataId : null,
				paramKey: paramKey,
				paramIndex: paramIndex,
				paramValues: paramValues,
				allSteps: this.stepDefRowData,
				prmPos: prmPos,
				// headerName: type === 'DATA' ? 'Test Data' : (type === 'LOC' ? 'Locator' : (type === 'ENV-VAR' ? ' Environment ' : 'Static Data')),
				headerName: type === 'DATA' ? 'Test Data' : (type === 'LOC' ? 'Locator' : (type === 'ENV-VAR' ? ' Environment ' : (type === 'API' ? ' API ' : (type === 'DB' ? ' DB ' : (type === 'VARIABLE' ? 'Variable' : (type === 'FUNCTION' ? 'Functions' : 'Static Data')))))),

			}
		});
		dialogRef.afterClosed().subscribe(result => {
			if (result.data === undefined) {
				this.getStepById_(this.scId, stepDefId, stepIndex, type);
			}

			if (result.data && type === 'DATA') {
				this.getTestDataById(this.scTestDataId);
			}

			if (type === 'DATA') {
				let tdData = _.findWhere(this.scTestData, { _id: this.scTestDataId })
				tdData.data[0].headers.push(result)
				tdData.data[0].values[0].push("")
				this.td.headers = tdData.data[0].headers;
				this.td.values[0] = tdData.data[0].values[0]
			}
		});
	};

	getTestDataById(testDataId) {
		this.appService.postData('/getTestData', { testDataId: testDataId, type: 'TD', isFilter: "Y", sCode: this.scAutoId })
			.subscribe(res => {

				if (res.data && res.data.length > 0) {
					if (res.data[0].data && res.data[0].data.length > 0) {
						let tD = res.data[0].data[0];
						this.td.headers = (tD.headers && tD.headers.length > 0) ? tD.headers : [];
						this.td.values = (tD.values && tD.values.length > 0) ? tD.values : [];
						this.scTDLinked = true;
					}
					//this.buckList = res.data[0].buckList ? res.data[0].buckList : [];
				} else {
					this.utils.setToast('info', 'TestData not found', 'NO-DATA');
				};
			}, error => {
				this.utils.setToast('error', error.statusCode, 'ERROR')
			});
	}


	// Get Step By Id
	getStepById_(tcId, stepId, stepIndex, paramType) {
		this.appService.postData('/getStepDefById_',
			{ tcId: tcId, stepId: stepId, stepIndex: stepIndex, type: paramType })
			.subscribe(res => {
				if (res.data && res.data[0].tcSteps && res.data[0].tcSteps.length > 0) {
					this.stepDefRowData[stepIndex] = this.nameResolveParams(res.data[0].tcSteps)[0];
				};
			})
	}
	// Remove Param values
	removeParam(paramValues, paramKey, stepDefId, stepIndex, paramType, paramVal) {
		let reqObj = {
			tcId: this.scId,
			stepId: stepDefId,
			stepIndex: stepIndex,
			paramVal: [],
			isMulti: false,
			type: 'remove',
			paramType: paramType,
			rmvPrm: paramVal
		};
		let count = 0;
		_.each(this.stepDefRowData, eStp => {
			if (eStp.paramValues && eStp.paramValues.length > 0) {
				_.each(eStp.paramValues, fPRM => {
					if (fPRM.paramType && fPRM.paramType.toLowerCase() === 'data' && fPRM[_.keys(fPRM)[0]] === paramVal) {
						count = count + 1;
					};
				});
			};
		});
		if (count > 1) reqObj.isMulti = true;
		if (paramValues && paramValues.length > 0) {
			_.map(paramValues, eachParam => {
				if (_.contains(_.keys(eachParam), paramKey)) {
					eachParam[paramKey] = '';
					eachParam.paramType = '';
					eachParam = _.omit(eachParam, 'header', 'loc_id', 'dataType', 'locNm', 'page_id', 'configNm');
					reqObj.paramVal.push(eachParam)
				} else {
					reqObj.paramVal.push(eachParam);
				}
			});
		};
		this.appService.postData('/update/stepParams', reqObj)
			.subscribe(res => {
				if (res.status === 201) {
					this.utils.setToast('info', 'Try Again later', 'NOT-UPDATED');
				} else {
					this.utils.setToast('success', 'Value Updated', 'UPDATED');
					this.getStepById_(this.scId, stepDefId, stepIndex, null);
				}
			}, error => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
			});
	}

	// Add New SC Testdata row
	addNewScTDRow() {
		this.isAllValuesFills = false;
		let newSetVal = [];
		_.each(this.td.headers, (eTDHdr, hdrIndx) => {
			if (hdrIndx === 0) {
				newSetVal.push(this.scAutoId);
			} else if (hdrIndx === 1 && _.contains(this.td.headers, '_status')) {
				newSetVal.push('true');
			} else {
				newSetVal.push("");
			};
		});
		this.td.values = [...this.td.values, newSetVal];

		//this.td.values.push(newSetVal);
	};

	textdisable(data: any, valI: any) {
		this.canSave = true;
		all:
		for (var value of data.values) {
			let ind = 0;
			for (var i of value) {
				if ((i == null || i.toString().trim() == '') && ind !== null && (ind <= 1 || ind == 5)) {
					this.isAllValuesFills = false;
					break all;
				} else {
					this.isAllValuesFills = true;
				}
				ind++;
			}
			if (value == "") {
				this.isAllValuesFills = false;
			}
		}
		this.scLastMod = new Date();
		this.td.values[valI].nativeElement.focus();
		data.values = data.values.map((m) => { return m.map(function (item) { if (item != null) return item.toString().replace(/ {2,}/g, ' '); else return item; }); });
	}

	// Save Scenario TestData
	saveSCTD() {
		this.canSave = false;
		let testDataId = (!_.isEmpty(this.scTestDataIdTmp) ? this.scTestDataIdTmp : this.scTestDataId);
		let obj = { tdVals: this.td.values, tcId: this.scId, testdata_id: testDataId, scCode: this.scAutoId, delItems: this.delRow };
		this.appService.postData('/saveScTdData', obj)
			.subscribe(res => {
				if (res.data !== null) {
					this.utils.setToast('success', 'Data saved successfully', 'Saved', 300);
				} else {
					this.utils.setToast('warning', 'Try again later', 'Not Saved')
				};
				this.delRow = [];
				this.getTestDataById(testDataId);
			}, error => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR')
			});
	};
	// Remove Testdata Row
	removeRow(indx, valRow) {
		this.canSave = true;
		this.td.values.splice(indx, 1);
		this.td.values = [...this.td.values];
		if (!_.isEmpty(valRow[2]))
			this.delRow.push(valRow[2]);
	};
	// Download TestData
	dwnldTD() {
		if (this.td.headers && this.td.headers.length > 0
			&& this.td.values && this.td.values.length > 0) {
			let sheetData = [];
			let headers = _.pluck(this.td.headers, 'name');
			sheetData.push(headers);
			_.each(this.td.values, eVAL => sheetData.push(_.pluck(eVAL, 'name')));
			const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);
			const wb: XLSX.WorkBook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, String(this.scName));
			XLSX.writeFile(wb, `${this.scAutoId}.xlsx`);
		} else {
			this.utils.setToast('warning', 'No TestData Found', 'No Data');
		};
	};

	/** Whether the number of selected elements matches the total number of rows. */
	isAllSelected() {
		if (this.filteredRdata && this.filteredRdata.data.length > 0) {
			const numSelected = this.selection.selected.length;
			const numRows = this.filteredRdata.data.length;
			return numSelected === numRows;
		} else {
			return false;
		}
	}

	/** Selects all rows if they are not all selected; otherwise clear selection. */
	masterToggle() {
		this.isAllSelected() ?
			this.selection.clear() :
			this.filteredRdata.data.forEach(row => { this.selection.select(row) });
	}
	chckBxLbl(row): string {
		if (!row) {
			return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
		}
		return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
	}

	// Add new step using modal (Above | Below)
	addNewStep(index) {
		this.stpBtwn = true;
		this.stpBtwnIndex = index;
	};

	//Comment Step
	commentStep(step, index) {
		let state = parseInt(step.stpSts);
		let stepId = '';
		if (state == 1) {
			state = 0
		} else {
			state = 1
		}

		if (step.scStpType === 'SD') {
			stepId = step.stepDefId
		} else {
			stepId = step.sgId;
		}
		const reqData = {
			stepId: stepId,
			stepIndex: index,
			tcId: this.scId,
			stpSts: state,
			scStpType: step.scStpType,
			type: 'SC'
		}

		this.appService.postData('/step/comment', reqData)
			.subscribe(res => {
				if (res.data !== null && res.error === null) {
					this.getScenarioById(this.scId);
				}
			})
	}

	// Clone new step/Step group 
	cloneStep(step, index, stepDefData) {
		step.tcID = this.scId;
		step.stepType = step.sType;
		step.stpBtwnIndex = null;
		step.id = '';
		if (step.scStpType === 'SG') {
			const reqData = {
				text: '@' + step.scStpVal,
				category: 'SG'
			};
			this.appService.postData('/get/testCasesByText/', reqData)
				.subscribe(res => {
					this.aStepDefData = res.data;
					const saveReq = {
						keyWordId: step.keyWordId,
						tcID: this.scId,
						keys: [],
						paramValues: [],
						stepType: res.data[0]['ctgry'],
						id: res.data[0]['_id'],
						stpBtwnIndex: null
					}
					this.getUpdatedCloned(saveReq, index);

				}, error => {
					this.utils.setToast('error', 'Internal Server Error', 'ERROR');
				});
		} else {

			this.appService.postData('/getStepDefForTestCaseID', { tcId: step.tcID })
				.subscribe(result => {
					if (result.error === null && result.data) {
						if (result.data && result.data.length > 0) {
							let respData = result.data[0]['tcSteps'][index];
							step.paramValues = respData.paramValues;
							step.stepParamValues = respData.stepParamValues;
							step._id = result.data[0]['_id'];
							step.sName = respData.sName;
							step.sScope = respData.sScope;
							step.sType = respData.sType;
							step.scStpType = respData.scStpType;
							step.stepDefId = respData.stepDefId;
							step.stepDesc = respData.stepDesc;
							step.kName = respData.kName;
							step.keyWordId = respData.keyWordId;
							this.getUpdatedCloned(step, index);
						}
					}
				})
		}


	}

	getUpdatedCloned(step, index) {
		if ('stpSts' in step || step?.stpSts !== 1) {
			step.stpSts = parseInt('0');
		}
		this.appService.postData('/save/saveStepDef', step)
			.subscribe(res => {
				if (res.data !== null && res.error === null) {
					this.stepDefRowData.splice(index + 1, 0, step);
					let tcId = res.data[0].Id ? res.data[0].Id : res.data[0]['tcSteps'][0].sgId;
					const reqData = {
						tcId: res.data[0].Id ? res.data[0].Id : step.tcID,
						crntIndx: index + 1,
						prevIndx: this.stepDefRowData.length - 1,
						token: this.authUserData.token,
						type: 'SC'
					}
					this.appService.postData('/update/updateTestCaseSteps', reqData)
						.subscribe((res) => {
							if (res.error === null) {
								if (step.stepType === 'SG') {
									this.getScenarioById(step.tcID);
								} else {
									this.getScenarioById(tcId);
								}
								this.utils.setToast('success', 'Step cloned successfully', 'Success');
							} else if (res.error) {
								this.utils.setToast('error', res.error, 'Error');
							};
						}, error => {
							this.utils.setToast('error', error.statusCode, 'Error');
						});

					step.stpBtwnIndex = undefined;
					step.keys = [];
					this.stepChanged = false;
					this.aStepDefData = [];
					$('html, body, #scrllr').animate({ scrollTop: $('#scrllr')[0].scrollHeight }, 100);
					this.stpBtwnIndex = undefined;
				} else if (res.data === null && res.error !== null) {
					this.utils.setToast('warning', res.error.msg, 'Warning')
					return
				} else {
					this.utils.setToast('error', 'Unknown error please contact administrator', 'Error');
					return
				}
			}, error => {

			})
	}

	lockunlock() {
		// const _lcType = datas === 0 ? 1 : 0;
		if (this.isChecked == true) {
			this.isChecked = false;
		} else {
			this.isChecked = true;
		}
		let status = this.isChecked == true ? 1 : 0
		const reqData = {
			sc_id: this.scId,
			lockSts: status
		}

		this.appService.postData('/scenario/lock', reqData)
			.subscribe(res => {
				if (!res.error && res.data) {
					this.allowed = this.isChecked;
					var msg = status === 1 ? ' locked' : 'unlocked';
					this.utils.setToast('success', `Successfully ${msg}`, 'Success');
				} else {
					this.isChecked = true;
					this.allowed = true;
					this.utils.setToast('error', res.error, 'ERROR');
				}
				this.historytab();
			}, error => {
				this.isChecked = true;
				this.allowed = true;
				this.utils.setToast('error', "Internal Server Error", 'ERROR');
			});
	}
	historytab() {
		const reqData = {
			sc_id: this.scId,
			tz: this.authUserData.zone
		}
		this.appService.postData('/scenario/scHistory', reqData)
			.subscribe(res => {
				this.hislist = res.data;
				this.fltrdhistorylist = new MatTableDataSource(this.hislist);
				const v1 = document.querySelector('.textWidth') as HTMLElement;
				if (v1) {
					// this.sgSteps = this.nameResolveParams(res.data[0].tcSteps);
					this.textEllipseWidth = `${(v1 as HTMLElement).clientWidth - 15}px`;
				}
			})
	}
	getVersion(ele) {
		const reqData = {
			sc_version_id: ele.version_id
		}
		this.appService.postData('/scenario/getVersion', reqData)
			.subscribe(res => {
				this.VersionList = res.data;
				this.sc_version_id = res.verScId;

				if (res.error === null && res.data) {
					if (res.data && res.data.length > 0) {
						if (!(_.isEmpty(res.data[0].tcSteps))) {
							this.sgSteps = this.nameResolveParams(res.data[0].tcSteps);
							this._modal.open(ModalDialogComponent, {
								width: '650px',
								data: {
									type: 'SGSTEPS',
									SGsteps: this.sgSteps,
									headerName: 'Steps'
								}
							})
						}
					}
				}
			})
	}

	vOverWrite(ele) {
		const reqData = {
			sc_id: this.scId,
			sc_version_id: ele.version_id,
			version_date: ele.dtCr
		}
		this.appService.postData('/scenario/overwrite', reqData)
			.subscribe(res => {
				if (!res.error && res.data) {
					this.utils.setToast('success', res.data, 'SUCCESS');
					this.historytab();

					this.appService.postData('/getStepDefForTestCaseID', { tcId: this.scId })
						.subscribe(result => {
							if (!result.error && !_.isEmpty(result.data)) {
								this.scName = result.data[0].name;
								this.scDesc = result.data[0].desc;
								this.scAutoId = result.data[0].sCode; // Auto generate Code
								this.extnl_id = !_.isEmpty(result.data[0].config) ? result.data[0].config.extnl_id : null; // External key
								this.scTestDataId = (result.data[0].testdata_id && result.data[0].testdata_id !== "") ? result.data[0].testdata_id : null;
								this.scEnvVarId = result.data[0]?.envvar_id;
								this.scEnvLinked = result.data[0]?.envvar_id ? true : false;
								this.scTDLinked = (result.data[0].testdata_id && result.data[0].testdata_id !== "") ? true : false;
								// this.td.headers = (result.data[0].headers && result.data[0].headers.length > 0) ? result.data[0].headers : [];
								// this.td.values = (result.data[0].values && result.data[0].values.length > 0) ? result.data[0].values : [];
								//this.getTestData();
								this.scTags = result.data[0].tagsData === 'null' ? [] : result.data[0].tagsData;
								if (!(_.isEmpty(result.data[0].tcSteps))) {
									this.stepDefRowData = this.nameResolveParams(result.data[0].tcSteps);
									this.scSteps = this.stepDefRowData;
								} else
									this.stepDefRowData = [];
								this.allowed = result.data[0].lockSts == 1 ? true : false;
								this.isChecked = result.data[0].lockSts == 1 ? true : false;
							}
						})

				} else
					this.utils.setToast('error', res.error.err, 'ERROR');
			}, error => {
				if (error && error.error.err)
					this.utils.setToast('error', error.error.err, 'ERROR');
				else
					this.utils.setToast('error', 'Internal Server Error', 'ERROR');
			});
	}
	ngOnDestroy() {
		this.routerEvent.unsubscribe();
		clearInterval(this.scTimer);
	}
}

@Component({
	selector: 'modaldialog-component',
	templateUrl: 'modaldialog-component.html',
	providers: [ScriptingComponent]
})
export class ModalDialogComponent {
	@ViewChild('scpaginator', { static: true }) scpaginator: MatPaginator;
	@ViewChild('scComp') scComp: ScriptingComponent;
	@ViewChild('scimpPaginator', { static: false }) scimpPaginator: MatPaginator;
	@ViewChild('scePaginator') scePaginator: MatPaginator;
	@ViewChild('fruitInput') sgTagsInput: ElementRef;
	@ViewChild('modName') modName: ElementRef<HTMLInputElement>;
	header = ['select','S No', 'Name'];

	rowDataColumns: string[] = ['select', 'no', 'name', 'desc', 'status'];
	filteredRdata: any;
	addNewTags: boolean = false;
	filterscenario = new MatTableDataSource([]);
	separatorKeysCodes: number[] = [ENTER, COMMA];
	tagCtrl = new FormControl();
	filteredTags: Observable<object[]>;
	scTagsExtrnl: object[] = [];
	allTags: any = [];
	// Loc Section
	locRepoData: any = [];
	configData: any = [];
	filterConfigData: any = [];
	configVal: any;
	configNm: any;
	// Params Values
	paramStatic: any;
	paramData: any;
	// Data
	paramsTdHeaders: any = [];
	hdrVal: any;
	paramsTdValues: any = [];
	isNewVal: boolean = false;
	isOpened: boolean = false;
	isOpened2: boolean = false;
	isNewVal2: boolean = false;

	@ViewChild('tagInput') tagInput: ElementRef<HTMLInputElement>;
	@ViewChild('auto') matAutocomplete: MatAutocomplete;
	@ViewChild('mySlct') mySlct: any;
	@ViewChild('mySlct2') mySlct2: any;

	extrnlTags: any = [];
	locId: String = '';
	pageId: String = '';
	pageList: any = [];

	// CopyScneario
	subNodes1: any;
	subNodes2: any;
	subNodes3: any;
	slctdScnrio: any;

	pageName = '';
	eleName = '';
	createPage: boolean = false;
	createEle: boolean = false;
	newHdrval: any = undefined;

	//Env prop
	envProp: any;
	createEnv: boolean = false;
	propName = '';
	isEncrypted: boolean = false;

	//API
	apiList: any;
	isSaveName = false;

	//DB
	dbList: any;

	//Variable 
	varList: any;
	varName = '';
	varId = '';
	varValue: any = undefined;
	createVar: boolean = false;
	vartype_id: any = undefined;
	vartype: [];
	selectVar: boolean = false;
	showVar: boolean = false;
	cvarValue: any = '';

	//Function
	funList: any;

	// Upload Sceanrio
	shiftData: boolean = false;
	upldScnrioFile: any;
	scnrioFile: any = undefined;
	shiftArray: any;
	selection = new SelectionModel<any>(true, []);
	authUserData: any = JSON.parse(localStorage.getItem('rt-AuthUser'));

	//chip impl
	visible: boolean = true;
	selectable: boolean = true;
	removable: boolean = true;
	addOnBlur: boolean = false;
	separatorKeysCode = [ENTER, COMMA];
	filteredsgTag: Observable<any[]>;
	sgCloneId = '';
	sgTag = new FormControl();
	tagList = [];
	selectedTags = [];
	isSelectedTag = false;
	fltrSelectedTag = [];
	fltrSelectedTags = [];
	editTagData = [];
	editMode = false;

	rsName_temp: any;
	reqData = [];
	selected_sub_scenarios: any;
	public aReqData = [];
	deptSceData = [];
	deptData: string;
	deptScenatioSearch: any = new FormControl('');
	requirementSearch: any = new FormControl('');
	public aDeptSceData = [];
	isStepDefDsbl: boolean = true;
	selectedDeptScn = [];
	selectedRequirement = [];
	selectedSubStatus: any;
	subStatus: any;
	status: any;
	scId = '';
	isvalidLocName = false;

	filteredRunPlan: any;
	editable: boolean = true;
	extnlIdUpdate: any = new FormGroup({
		extnl_id: new FormControl({ value: '', disabled: false })
	})
	showImpMdl: boolean = true;
	scLength: any;
	prjlist: any[] = [];
	currentProjectName: string;
	showError: boolean = false;
	prjNames: any;
	selectedPrj:any;
	selectedProjectName: string;
	selectedItems: any[] = [];
	masterToggleClicked: boolean = false;
	selectedLength = this.appservice.selectedItems.length;

	constructor(public dialogRef: MatDialogRef<ModalDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
		private appservice: AppService, private utils: UtilsService ) {
		this.filteredRunPlan = data.plans;
		
		this.filterscenario = new MatTableDataSource(data.scenariosList);

		this.filteredTags = this.tagCtrl.valueChanges.pipe(
			startWith(<string>null),
			map((tag: string | null) => tag ? this._filter(tag) : this.allTags.slice()));
		if (data.type === 'UPDATEEXTNLID') {
			this.extnlIdUpdate.setValue({
				extnl_id: data.ele.config && data.ele.config.extnl_id ? data.ele.config.extnl_id : ''
			});
			this.scId = data.ele._id;
		}
		if (data?.type === 'NEWSC') {
			this.tagList = data.tagList;
		}
		if (data?.type === 'NEWSC' && data?.mode === 'EDIT') {
			this.scId = data.sc._id;
			this.data.desc = data.sc.desc;
			this.appservice.postData('/tags/list', {}).subscribe(res => {
				let resData = res.data;
				if (res.data && resData[0]?.config.length > 0) {
					this.tagList = resData[0]?.config;
					this.filteredsgTag = this.sgTag.valueChanges.pipe(
						startWith(''),
						map((tag: string | null) => tag ? this.filter(tag) : this.tagList.slice()));
					if (data?.selectedTags?.length > 0) {
						data.selectedTags.forEach(tag => {
							this.tagList.forEach(config => {
								if (tag === config.configId) {
									this.selectedTags.push(config.name);
								}
							})
						})
					}
				}
			});

			if (data.sc.config?.dpdnt_sc != undefined && data.sc.config?.dpdnt_sc.length > 0) {
				this.selectedDeptScn = data.sc.config.dpdnt_sc;
				const reqData = {
					scName: data.sc.config?.dpdnt_sc[0] ? data.sc.config?.dpdnt_sc[0] : '',
					type: ''
				};
				this.appservice.postData('/scenario/list', reqData)
					.subscribe(res => {
						if (res.data.length > 0) {
							let searchKey = res.data[0].name ? res.data[0].name : ''
							this.deptScenatioSearch.patchValue(searchKey);
						}
					}, error => {
						this.utils.setToast('error', 'Internal Server Error', 'ERROR');
					});
			}
			if (data.sc.config?.req_sc != undefined && data.sc.config?.req_sc.length > 0) {
				this.selectedRequirement = data.sc.config.req_sc;
				const reqData = {
					reqName: data.sc.config?.req_sc[0] ? data.sc.config?.req_sc[0] : '',
					name: data.sc.config?.req_sc[0] ? data.sc.config?.req_sc[0] : '',
					type: '',
					tskType: 'R'
				};
				this.appservice.postData('/task/filter', reqData)
					.subscribe(res => {
						if (res.data.length > 0) {
							let searchKey = res.data[0].name ? res.data[0].name : ''
							this.requirementSearch.patchValue(searchKey);
						}
					}, error => {
						this.utils.setToast('error', 'Internal Server Error', 'ERROR');
					});
			}
		}

		this.deptScenatioSearch.valueChanges.pipe(
			map((value: any) => value),
			filter((res: any) => {
				if (res && !_.isEmpty(res))
					return true;
				else {
					this.aDeptSceData = [];
				};
			}),
			debounceTime(800),
			distinctUntilChanged()
		).subscribe(res => {
			if (res && res.length > 0) {
				this.getDeptScenByName(res)
			}
		});

		//  requirement
		this.requirementSearch.valueChanges.pipe(
			map((value: any) => value),
			filter((res: any) => {
				if (res && !_.isEmpty(res))
					return true;
				else {
					this.aReqData = [];
				};
			}),
			debounceTime(800),
			distinctUntilChanged()
		).subscribe(res => {
			if (res && res.length > 0) {
				this.requirementList(res);
			}
		});
	}

	onSubmitExt() {
		const reqData = {
			extnl_id: this.extnlIdUpdate.value.extnl_id,
			tcId: this.scId,
		};
		this.appservice.postData('/scenario/updateExtId', reqData)
			.subscribe(res => {
				if (!res.error && res.data) {
					this.utils.setToast('success', 'Successfully updated', 'Success');
					this.dialogRef.close();
				} else {
					this.utils.setToast('error', `${res.error}`, 'Error');
				}
			})
	}

	onNoClick(data): void {

		this.fltrSelectedTags = [];
		this.selectedTags.forEach(tag => {
			this.tagList.forEach(config => {
				if (tag === config.name) {
					this.fltrSelectedTags.push(config.configId);
				}
			})
		})

		data.configId = this.fltrSelectedTags;
		if (!_.isEmpty(this.aDeptSceData)) {
			data.dpdnt_sc = this.selectedDeptScn;
		} else {
			data.dpdnt_sc = [];
		}

		if (!_.isEmpty(this.aReqData)) {
			data.req_sc = this.selectedRequirement;
			//	data.req_sc = this.selectedRequirement;
		} else {
			data.req_sc = [];
		}
		this.dialogRef.close(data);
	}

	@HostListener('click') click(event) {
		if (this.isOpened && !this.isNewVal) {
			this.mySlct.close()
		};
		if (this.isOpened2 && !this.isNewVal) {
			this.mySlct2.close()
		};

	};
	ngOnInit() {
		
		this.currentProjectName = localStorage.getItem('rt-PrjName');
		this.projectlist();
		this.getTagList();
		//this.getSubStatus();
		if (this.data.type === 'TAGS') {
			this.scTagsExtrnl = this.data.tagsData;
			setTimeout(f => {
				this.getTags();
			}, 100)
		}
		if (this.data.type === 'PARAMS') {
			if (this.data.paramType === 'ENV-VAR')
				this.getEnvProp();
			if (this.data.paramType === 'API')
				this.getAPIList();
			if (this.data.paramType === 'DB')
				this.getDBList();
			if (this.data.paramType === 'VARIABLE')
				this.chooseVarType();
			if (this.data.paramType === 'FUNCTION')
				this.getFunList();

			if (this.data.paramType === 'STATIC' || this.data.paramType === 'ENV-VAR' ||
				this.data.paramType === 'API' || this.data.paramType === 'DB' ||
				this.data.paramType === 'VARIABLE' || this.data.paramType === 'FUNCTION') {
				this.paramStatic = this.data.stepVal;
			};
			if (this.data.paramType === 'LOC') {
				setTimeout(f => {
					this.getDefaultPageList();
					//this.getLocByPrjctId();
				}, 100)
			}
			if (this.data.paramType === 'DATA') {
				if (this.data.testdata_id) {
					setTimeout(f => {
						this.getTestData();
					}, 100)
				} else {
					this.utils.setToast('warning', 'No TestData Id found try again later', 'NO-DATA');
				}
			}
		}
		// if (this.data.type === 'NEWSC'){

		// 	setTimeout(f => {
		// 		this.requirementList();
		// 	}, 100)
		// }
	}

	ngAfterViewInit() {
		this.filterscenario =new MatTableDataSource(this.data.scenariosList);
		this.filterscenario.paginator = this.scePaginator;
		this.modName.nativeElement.focus();
	}

	getDeptScenByName(searchVal) {
		this.aDeptSceData = [];
		if (searchVal.toLowerCase() && !_.isEmpty(searchVal)) {
			const reqData = {
				scName: searchVal,
				type: 'search',
				scId: this.scId
			};
			if (reqData.scName && reqData.scName.length > 2) {
				this.appservice.postData('/scenario/list', reqData)
					.subscribe(res => {
						this.aDeptSceData = res.data;
					}, error => {
						this.utils.setToast('error', 'Internal Server Error', 'ERROR');
					});
			}
			else {
				this.aDeptSceData = [];
			}
		}
	}

	// getSubStatus() {
	// 	this.appservice.getData('/scenario/subStatus').subscribe(
	// 		result => {
	// 			if (result.data) {
	// 				this.subStatus = Object.keys(result.data).map(key => ({ id: key, value: result.data[key] }));
	// 			}
	// 		}
	// 	)
	// }

	requirementList(searchVal) {
		this.aReqData = [];
		if (searchVal.toLowerCase() && !_.isEmpty(searchVal)) {
			const reqData = {
				reqName: searchVal,
				type: 'search',
				name: searchVal,
				tskType: 'R'
			};
			if (reqData.reqName && reqData.reqName.length > 2) {
				this.appservice.postData('/task/filter', reqData)
					.subscribe(res => {
						this.aReqData = res.data;
					}, error => {
						this.utils.setToast('error', 'Internal Server Error', 'ERROR');
					});
			}
			else {
				this.aReqData = [];
			}
		}

	}

	submitDeptScnario(reqParams) {
		this.selectedDeptScn = [];
		this.selectedDeptScn.push(reqParams._id);
	}

	submitRequirement(reqParams) {
		this.selectedRequirement = [];
		this.selectedRequirement.push(reqParams.id);
	}

	chooseSubStatus(status) {
		this.selectedSubStatus = status;
		this.data.subStatus = this.selectedSubStatus;
	}

	optionSubmit(scenario, require) {	// Using on AutoComplete triggered at (MouseClick, and Entered)
		this.submitDeptScnario(scenario);
		this.submitRequirement(require);
	};

	// optionSubmit(require){
	// 	this.submitRequirement(require)
	// }

	getTagList() {
		this.filteredsgTag = this.sgTag.valueChanges.pipe(
			startWith(''),
			map((tag: string | null) => tag ? this.filter(tag) : this.tagList.slice()));
		if (this.selectedTags.length >= 0) {
			this.selectedTags.forEach(tag => {
				this.tagList.forEach(config => {
					if (tag === config.name) {
						this.fltrSelectedTag.push(config.configId);

					}
				})
			})
		}
		/* if(this.editMode == true){
		  if (this.editTagData?.length > 0) {
			this.editTagData.forEach(tag => {
			  this.tagList.forEach(config => {
				if (tag === config.configId) {
				  this.selectedTags.push(config.name);
				}
			  })
			})
		  }
		} */
	}

	filter(name: string) {
		return this.tagList.filter(tag => {
			return tag.name.toLowerCase().match(name.toLowerCase());
		});
	}

	added(event: MatChipInputEvent): void {
		const input = event.input;
		const value = event.value;
		this.sgTag.setValue(null);
	}

	removed(tag: any): void {
		const index = this.selectedTags.indexOf(tag);
		if (this.selectedTags.length === 1) {
			this.isSelectedTag = false;
		}

		if (index >= 0) {
			this.selectedTags.splice(index, 1);
			// this.isSelectedTag = true;
		}

	}

	selecte(event: MatAutocompleteSelectedEvent): void {
		this.selectedTags.push(event.option.viewValue);
		this.isSelectedTag = true;
		this.sgTagsInput.nativeElement.value = '';
		this.sgTag.setValue(null);
	}

	checkInputValue(name) {
		// if (name !== '' && name.match('^[0-9a-zA-Z%()./#$@~{}/[<>!?^*\\]"/\'/][a-zA-Z0-9_-\\s%()./#$@~{}/[<>!?^*\\]"/\'/]*$') !== null) {
		//if (name !== '' && name.match('^[0-9a-zA-Z%()./#$@~{}/[<>!?^*\\]"/\'/][a-zA-Z0-9_-\\s%()./#$@~{}/[<>!?^*\\]"/\'/]*$') !== null) {
		if (name !== '' && name.match('^(?=.*[A-Za-z0-9])[A-Za-z0-9@\\\-_.() ]*$') !== null && name.trim() !== "") {
			this.isSaveName = false;
		} else {
			this.isSaveName = true;
		}
	}
	filterEle(eleName) {
		this.configData = _.filter(this.filterConfigData, e => e.objName.toLowerCase().includes(eleName.toLowerCase()));
	}
	chooseEle(mData) {
		if (!_.isEmpty(mData)) {
			this.configNm = mData.objName;
			this.configVal = mData.objId;
		} else {
			this.configNm = "";
			this.configVal = "";
		}
	}
	// Get All tags
	getTags() {
		this.appservice.postData('/getAllTags', { token: JSON.parse(localStorage.getItem('rt-AuthUser')).token })
			.subscribe(res => {
				this.allTags = res.data;
			}, error => {
				this.utils.setToast('danger', error.statusCode, 'ERROR');
			});
	};
	// Get TestData
	getTestData() {
		this.appservice.postData('/testdatavalue', { testdata_id: this.data.testdata_id })
			.subscribe(res => {
				if (res.data && res.data.length > 0) {
					this.paramsTdHeaders = res.data;
					this.hdrVal = this.data.stepVal;
				} else {
					this.utils.setToast('info', 'Headers not found', 'NO-DATA');
				};
			}, error => {
				this.utils.setToast('error', error.statusCode, 'ERROR')
			});
	};

	// Get Requirement

	// Filtering function
	add(event: MatChipInputEvent): void {
		// if (!this.matAutocomplete.isOpen) {
		// 	const input = event.input;
		// 	const value = event.value;
		// 	if ((value || '').trim()) {
		// 		this.scTagsExtrnl.push({ id: Number(this.allTags.length + 1), name: value.trim(), type: 'new' });
		// 		this.allTags.push({ id: Number(this.allTags.length + 1), name: value.trim(), type: 'new' })
		// 	}
		// 	if (input) {
		// 		input.value = '';
		// 	}
		// 	this.tagCtrl.setValue(null);
		// }
	};

	remove(elem: any): void {
		const scIndex = _.findIndex(this.scTagsExtrnl, elem);
		// const allTgIndex = _.findIndex(this.allTags, elem);
		if (scIndex >= 0) {
			this.scTagsExtrnl.splice(scIndex, 1);
		};
		// if (allTgIndex >= 0) {
		// 	this.allTags.splice(allTgIndex, 1);
		// 	this.filteredTags = this.allTags;
		// };
	};

	selected(event: MatAutocompleteSelectedEvent): void {
		let isDup = false;
		if (this.scTagsExtrnl && this.scTagsExtrnl.length > 0) {
			_.each(this.scTagsExtrnl, (eachTag) => {
				if (eachTag.name.toLowerCase() === event.option.value.name.toLowerCase()) {
					this.utils.setToast('warning', 'You cannot add same Tag', 'Duplicate');
					isDup = true;
				};
			});
		};
		if (!isDup) {
			this.scTagsExtrnl.push(event.option.value);
		}
		this.tagInput.nativeElement.value = '';
		this.tagCtrl.setValue(null);
	};

	private _filter(value: any) {
		if (_.isObject(value)) {
			const filterValue = value.name.toLowerCase();
			return this.allTags.filter(tag => tag.name.toLowerCase().indexOf(filterValue) === 0);
		} else {
			const filterValue = value.toLowerCase();
			return this.allTags.filter(tag => tag.name.toLowerCase().indexOf(filterValue) === 0);
		};
	};
	// Save tags
	saveTags() {
		let tagIds = _.pluck(this.scTagsExtrnl, 'id');
		this.appservice.postData('/saveTags', { tags: tagIds, tcId: this.data.scId, token: JSON.parse(localStorage.getItem('rt-AuthUser')).token })
			.subscribe(res => {
				if (res.data !== null) {
					this.utils.setToast('success', 'Tags are saved successfully', 'SAVED');
					this.dialogRef.close(res.data);
				} else {
					this.utils.setToast('danger', 'Not Saved try again later', 'NOT-UPDATED');
					this.dialogRef.close(res.data);
				};
			}, error => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
			});
	};
	getDefaultPageList() {
		this.appservice.postData('/defaultPageList', {})
			.subscribe(res => {
				this.pageList = _.sortBy(res.data.pageList, 'tName');
				if (!_.isEmpty(this.pageList)) {
					const locData = _.findWhere(this.data.paramValues, { [this.data.paramKey]: this.data.stepVal, paramType: 'LOC' });
					if (!_.isEmpty(locData)) {
						this.pageId = locData.page_id;
						this.choosePage(this.pageId, null);
						this.configVal = !_.isEmpty(this.data.stepVal) ? this.data.stepVal : "";
						this.configNm = !_.isEmpty(locData.configNm) ? locData.configNm : "";
					}
				} else
					this.pageId = "";
			}, error => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
				return
			});
	}
	// Loc Functions
	getLocByPrjctId() {
		this.appservice.postData('/getLocByPrjId', { token: JSON.parse(localStorage.getItem('rt-AuthUser')).token })
			.subscribe(res => {
				this.locRepoData = res.data;
				if (this.data.paramValues && this.data.paramValues.length > 0) {
					const locData = _.findWhere(this.data.paramValues, { [this.data.paramKey]: this.data.stepVal, paramType: 'LOC' });
					if (locData) {
						this.pageId = locData.page_id;
						this.locId = locData.loc_id;
					} else {
						let dLoc = _.findWhere(this.locRepoData, { name: "Default" });
						this.locId = !_.isEmpty(dLoc) ? dLoc._id : '';
					};
					this.loadPageDetails();
					this.locChange(this.locId.toString());
				}
			}, error => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
				return
			});
	};
	// LOC onchanges
	locChange(locId) {
		let mtchdConfig = _.findWhere(this.locRepoData, { _id: locId });
		let mtchdConfigwtPageId = _.where(mtchdConfig.config, { 'pageId': this.pageId });
		this.configData = mtchdConfigwtPageId;
		this.filterConfigData = mtchdConfigwtPageId;
		if (this.data.stepVal && this.data.stepVal !== '') {
			this.configVal = this.data.stepVal;
			let flVal = _.findWhere(this.filterConfigData, { objId: this.data.stepVal })
			this.configNm = !_.isEmpty(flVal) ? flVal.objName : '';
		}
	};
	/*create loc start*/
	chooseLoc(locId) {
		this.locId = locId;
		if (this.data.stepVal && this.data.stepVal !== '') {
			this.pageId = '';
		}
		this.loadPageDetails();
	}
	choosePage(pageId, type) {
		this.pageId = pageId;
		this.configVal = '';
		this.configNm = '';
		//this.data.stepVal ='';
		const reqParam = {
			token: this.authUserData.token,
			type: 'getDefaultLocsLocator',
			pageId: pageId,
		}
		this.appservice.getByData('/getDefaultLocsLocator', reqParam)
			.subscribe((res) => {
				if (!_.isEmpty(res.data)) {
					this.configData = _.sortBy(res.data, 'tName');
					this.filterConfigData = res.data;
					if (type === 'new') {
						this.configVal = _.find(this.configData, { objName: this.eleName, tName: this.eleName }).objId;
						this.configNm = this.eleName;
					}
				}
			}, (err) => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
			});
	}

	onchangevar(e) {
		this.showVar = true;
		this.selectVar = false;
		this.vartype_id = e.value;
		this.getVarList();
	}

	chooseVarType() {
		this.vartype = [];
		let reqData = {
			configType: "VARIABLE_TYPES"
		}
		this.appservice.postData('/config/type', reqData).subscribe(res => {
			this.vartype = res.data;
		});

	}

	// choosePage(pageId) {
	// 	this.pageId = pageId;
	// 	this.configVal = '';
	// 	this.data.stepVal ='';
	// 	this.configNm ='';
	// 	const reqParam = {
	// 		auth: this.authUserData,
	// 		type: 'getSinglePageDetails',
	// 		pageId: pageId,
	// 		locId: this.locId
	// 	}
	// 	this.appservice.getByData('/getSinglePageDetails', reqParam)
	// 		.subscribe((res) => {
	// 			if (typeof res.data[0] !== 'undefined') {
	// 				this.locChange(this.locId)
	// 			}
	// 		}, (err) => {
	// 			this.utils.setToast('error', 'Internal Server Error', 'Error');
	// 		});
	// }
	loadPageDetails() {
		const reqParam = {
			auth: this.authUserData,
			type: 'listPage',
		}
		this.appservice.getByData('/locList', reqParam)
			.subscribe((res) => {
				this.pageList = res.data.listData;
			}, (err) => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
			});
	}
	getEnvProp() {
		// Get All Envs
		this.appservice.getByData('/getenvprop', { type: 'ENV' })
			.subscribe(res => {
				// this.envProp = res.data[0].config;
				if (res.data[0]) {
					this.envProp = res.data[0];
				}
			}, error => {
				this.utils.setToast('danger', error.statusCode, 'ERROR');
			});


	}

	getAPIList() {
		// Get All APIs
		this.appservice.postData('/getApiHost',{})
			.subscribe(res => {
				if (res.data && res.data.apiList.length > 0) {
					this.apiList = res.data.apiList;
					_.each(this.apiList, (data: any) => {
						data.name = `rt.api.${data.name}`;
					});
				}
			}, error => {
				this.utils.setToast('danger', error.statusCode, 'ERROR');
			});
	}

	getVarList() {
		let reqData = {
			type: this.vartype_id,
		};
		this.appservice.postData('/var/list', reqData).subscribe(res => {

			if (res.data.length > 0) {
				this.varList = res.data;
				if (this.selectVar) {
					this.paramStatic = this.varList[0].code;
					this.cvarValue = this.varList[0].value;
				}
			};
		}, error => {
			this.utils.setToast('danger', error.statusCode, 'ERROR');
		});
	}

	getVarValue(e) {
		this.cvarValue = _.findWhere(this.varList, { "code": e.value }).value;
	}

	getFunList() {
		this.appservice.getByData('/functionList', { isDraft: false }).subscribe(res => {
			if (res.data.length > 0) {
				this.funList = res.data;
				_.each(this.funList, (data: any) => {
					data.functionName = `rt_custom.${data.functionName}`;
				});
			};
		}, error => {
			this.utils.setToast('danger', error.statusCode, 'ERROR');
		});
	}

	getDBList() {
		// Get All APIs
		this.appservice.getByData('/queries/list', {})
			.subscribe(res => {
				if (res.data) {
					this.dbList = res.data.queriesList;
					_.each(this.dbList, (data: any) => {
						data.name = `rt.db.${data.name}`;
					});
				}
			}, error => {
				this.utils.setToast('danger', error.statusCode, 'ERROR');
			});
	}

	/*create loc end*/
	// Params Functions ===================
	saveParamStatic() { // Param Static Save

		let reqObj = {
			tcId: this.data.tcId,
			stepId: this.data.stepId,
			stepIndex: this.data.stepIndex,
			paramVal: this.data.paramValues,
			paramType: this.data.paramType,
		};
		if (reqObj.paramVal && reqObj.paramVal.length > 0) {
			reqObj.paramVal.forEach(eachParam => {
				if (_.contains(_.keys(eachParam), this.data.paramKey)) {
					eachParam[this.data.paramKey] = this.paramStatic;
					if (this.paramStatic && this.paramStatic !== '') {
						eachParam.paramType = this.data.paramType;
					} else
						eachParam.paramType = ''
				};
			});
		};
		this.appservice.postData('/update/stepParams', reqObj)
			.subscribe(res => {
				if (res.status === 201) {
					this.utils.setToast('info', 'Try Again later', 'NOT-UPDATED');
					this.dialogRef.close(this.paramStatic);
				} else {
					this.utils.setToast('success', 'Value Updated', 'SUCCESS');
					this.dialogRef.close(this.paramStatic);
				};
			}, error => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
			});
	};
	// Testdata Header change()
	// hdrChange(hdr) {
	// 	let mtchd = _.findWhere(this.paramsTdHeaders, { 'header': hdr });
	// 	this.paramsTdValues = mtchd.values;
	// };
	// Save param of Data value
	saveParamData() {
		let reqObj = {
			tcId: this.data.tcId,
			stepId: this.data.stepId,
			stepIndex: this.data.stepIndex,
			paramVal: [],
			paramType: 'DATA',
			newPrm: this.hdrVal,
			updtTerm: 'UPDHDRS',
			scHdrs: []
		};
		_.each(this.data.allSteps, (eStp, asI) => {
			if (eStp.paramValues && eStp.paramValues.length > 0) {
				if (Number(asI) === this.data.stepIndex) {
					_.each(eStp.paramValues, (fPRM, pvI) => {
						if (fPRM.paramType && fPRM.paramType.toLowerCase() === 'data') {
							if (reqObj.newPrm && (pvI + 1 === this.data.prmPos)) {
								reqObj.scHdrs.push(this.hdrVal);
							} else {
								if (!_.isEmpty(fPRM[_.keys(fPRM)[0]]))
									reqObj.scHdrs.push(fPRM[_.keys(fPRM)[0]]);
							}
						} else {
							if (reqObj.newPrm && (pvI + 1 === this.data.prmPos))
								reqObj.scHdrs.push(this.hdrVal);
						};
					});
				} else {
					_.each(eStp.paramValues, fPRM => {
						if (fPRM.paramType && fPRM.paramType.toLowerCase() === 'data')
							reqObj.scHdrs.push(fPRM[_.keys(fPRM)[0]]);
					});
				}
			};
		});
		if (this.data.paramValues && this.data.paramValues.length > 0) {
			_.map(this.data.paramValues, eachParam => {
				if (_.contains(_.keys(eachParam), this.data.paramKey) && (eachParam.type && eachParam.type.toLowerCase() !== 'loc' || _.isEmpty(eachParam.paramType))) {
					eachParam[this.data.paramKey] = this.hdrVal ? this.hdrVal : '';
					eachParam.paramType = this.hdrVal ? 'DATA' : '';
					eachParam.dataType = this.hdrVal ? this.data.paramDataType : '';
					reqObj.paramVal.push(eachParam);
				} else
					reqObj.paramVal.push(eachParam);
			});
		};
		this.appservice.postData('/update/stepParams', reqObj)
			.subscribe(res => {
				if (res.status === 201) {
					this.utils.setToast('info', 'Try Again later', 'NOT-UPDATED');
					this.dialogRef.close(this.hdrVal);
				} else {
					this.utils.setToast('success', 'Value Updated', 'SUCCESS');
					//	this.dialogRef.close({ data: this.isNewVal2 });
					this.dialogRef.close(this.hdrVal);
				};
			}, error => {
				this.utils.setToast('error', 'Internal Server Error', 'ERROR');
			});
	};
	dialogClose() {
		this.dialogRef.close({ data: this.isNewVal2 });
	}
	// Save Loc Data
	saveLocData() {
		if (this.pageId !== '' && this.configVal !== '') {
			this.paramStatic = this.configVal;
			let reqObj = {
				tcId: this.data.tcId,
				stepId: this.data.stepId,
				stepIndex: this.data.stepIndex,
				paramVal: [],
				paramType: 'LOC',
			};
			if (this.data.paramValues && this.data.paramValues.length > 0) {
				this.data.paramValues.forEach(eachParam => {
					if (_.contains(_.keys(eachParam), this.data.paramKey)) {
						eachParam[this.data.paramKey] = this.configVal;
						if (this.configVal && this.configVal !== '') {
							let locObj = {
								[this.data.paramKey]: this.configVal,
								"type": "LOC",
								"paramType": "LOC"
							}
							reqObj.paramVal.push(locObj);
						} else {
							eachParam.paramType = ''
							eachParam = _.without(eachParam, 'loc_id');
							eachParam = _.without(eachParam, 'page_id');
							reqObj.paramVal.push(eachParam);
						};
					} else {
						reqObj.paramVal.push(eachParam);
					};
				});
			};
			this.appservice.postData('/update/stepParams', reqObj)
				.subscribe(res => {
					this.configVal = "";
					this.configNm = "";
					if (res.status === 201) {
						this.utils.setToast('info', 'Try Again later', 'NOT-UPDATED');
						this.dialogRef.close(res.data);
					} else {
						this.dialogRef.close(res.data);
						this.utils.setToast('success', 'Value Updated', 'SUCCESS');
					};
				}, error => {
					this.utils.setToast('error', 'Internal Server Error', 'ERROR');
				});
		} else {
			this.utils.setToast('error', 'Please fill all the fields', 'ERROR');
		}

	};

	// Add new hader
	saveHdr(value) {
		let isExist = false;
		_.each(this.paramsTdHeaders, eHDR => {
			if (String(eHDR.header).toLowerCase() === value.toLowerCase()) {
				this.utils.setToast('warning', 'Already Exist', 'CONFLICT');
				isExist = true;
			};
		});
		if (!isExist) {
			this.appservice.postData('/setNewHeader', { testdata_id: this.data.testdata_id, code: this.data.tcCode, newHdr: value })
				.subscribe(res => {
					if (!res.code && !res.error && (res.data && res.data !== '')) {
						this.paramsTdHeaders = res.data;
						this.isNewVal = false;
						this.hdrVal = value;
						this.isNewVal2 = true;
					} else {
						this.utils.setToast('info', 'Data not Saved', 'NOT-UPDATED');
					}
				}, error => {
					this.utils.setToast('error', 'Internal Server Error', 'ERROR');
				});
		};
	};



	// Testdata changes tracking
	customTrack(index, item) {
		return index;
	};
	// Level Changecheck
	level1Chng(slctdMod1) {
		this.slctdScnrio = slctdMod1;
		this.appservice.getData(`/submodules/${slctdMod1}`).subscribe((res: any) => {
			this.subNodes1 = res.data
		});
	}

	level2Chng(slctdMod2) {
		this.slctdScnrio = slctdMod2;
		this.appservice.getData(`/submodules/${slctdMod2}`).subscribe((res: any) => this.subNodes2 = res.data);
	}
	level3Chng(slctdMod3) {
		this.slctdScnrio = slctdMod3;
		this.appservice.getData(`/submodules/${slctdMod3}`).subscribe((res: any) => this.subNodes3 = res.data);
	}
	level4Chng(slctdMod4) {
		this.slctdScnrio = slctdMod4;
	}
	moveToMod(mode) {
		this.dialogRef.close({ mode: mode, slctdScnrio: this.slctdScnrio });
	}
	//Create new page start
	closePage() {
		this.pageName = '';
		this.createPage = false;
	}
	closeEle() {
		this.eleName = '';
		this.createEle = false;

	}
	closeProp() {
		if (this.propName.replace(/ {2,}/g, ' ').trim().length > 0) {
			this.paramStatic = this.propName;
		}
		this.propName = '';
		this.createEnv = false;

	}
	closeVar() {
		if (this.varName.trim().length > 0) {
			this.paramStatic = this.varName;
		}
		this.varName = '';
		this.varValue = '';
		this.createVar = false;
		this.selectVar = false;
		this.showVar = true;
	}
	saveNewProp() {
		if (this.propName.trim().length > 0) {
			if (this.envProp && this.envProp.config && this.envProp.config.length > 0) {
				this.envProp.config.push({ name: this.propName, isEncrypted: this.isEncrypted });
			}
			let reqObj = {
				config: this.envProp && this.envProp.config ? this.envProp.config : [{ name: this.propName, isEncrypted: this.isEncrypted }],
				type: 'ENV',
				id: undefined,
				ctype: 'create'
			};
			if (this.envProp && this.envProp._id) {
				reqObj.ctype = 'update';
				reqObj.id = this.envProp._id;
			};
			this.appservice.postData('/setenvprop', reqObj)
				.subscribe(res => {
					if (res.data && res.data !== '') {
						this.utils.setToast('success', `Successfully created`, 'Success');
						this.getEnvProp();
						this.closeProp();
					}
				}, error => {
					if (error.status === 409) {
						this.utils.setToast('warning', 'Properties must be unique', 'Duplicate');
						this.getEnvProp();
					} else {
						this.utils.setToast('error', error, 'Error');
						this.getEnvProp();

					}
				});
		} else {
			this.utils.setToast('error', "Fill Env Propert Name", 'ERROR');
		}
	}
	saveNewPage() {
		const reqParam = {
			type: 'createNewPage',
			pageName: this.pageName,
		}
		if (this.pageName.trim().length > 0) {
			this.appservice.getByData('/createAndUpdatePage', reqParam)
				.subscribe((res) => {
					//this.pageName = '';
					const datas = res.data;
					//this.pageId = res.data._id;
					if (datas.commonErr && typeof datas.commonErr != 'undefined') {
						this.utils.setToast('error', datas.commonErr, 'ERROR');
					} else {
						this.getDefaultPageList();
						this.pageId = datas._id;
						this.utils.setToast('success', "Successfully created", 'SUCCESS');
						this.createPage = false;
					}
				}, (err) => {
					this.utils.setToast('error', "Internal server error", 'ERROR');
				});
		} else {
			this.utils.setToast('error', "Fill Variable Name", 'ERROR');
		}
	}
	saveNewEle() {
		if (!_.isEmpty(this.pageId) && !_.isEmpty(this.eleName.trim())) {
			const reqParam = {
				type: 'createNewPage',
				eleName: this.eleName.trim(),
				pageId: this.pageId,
				locId: this.locId
			}
			this.appservice.getByData('/createElements', reqParam)
				.subscribe(async (res) => {
					const datas = res.data;
					this.eleName = res.data.objName;
					if (datas.commonErr && typeof datas.commonErr != 'undefined') {
						this.utils.setToast('error', datas.commonErr, 'ERROR');
					} else {
						this.choosePage(this.pageId, 'new');
						this.utils.setToast('success', "Successfully created", 'SUCCESS');
						this.createEle = false;
						//this.configNm = this.eleName;

					}
				}, (err) => {
					this.utils.setToast('error', "Internal server error", 'ERROR');
				});
		} else {
			this.utils.setToast('error', "Please fill all fields", 'ERROR');
		}


	}
	saveNewVar() {
		let reqData = {
			varId: this.varId,
			name: this.varName,
			type: this.vartype_id,
			value: this.varValue
		};
		if (this.varName.replace(/ {2,}/g, ' ').trim().length > 0 && this.varValue.replace(/ {2,}/g, ' ').trim().length > 0) {
			this.appservice.postData('/var/save', reqData)
				.subscribe((res) => {
					const datas = res.data;
					let varId = datas.varId
					if (datas.commonErr && typeof datas.commonErr != 'undefined') {
						this.utils.setToast('error', datas.commonErr, 'ERROR');
					} else {
						this.getVarList();
						this.utils.setToast('success', "Successfully created", 'SUCCESS');
						this.createVar = false;
						this.selectVar = true;
						this.showVar = true;
						this.varName = '';
						this.varValue = '';
					}
				}, (err) => {
					if (err.error && err.error.err && typeof err.error.err != 'undefined')
						this.utils.setToast('error', err.error.err, 'ERROR');
					else
						this.utils.setToast('error', "Internal server error", 'ERROR');
				});
		} else {
			this.utils.setToast('error', "Fill Variable Name/Value", 'ERROR');
		}

	}
	createNewPage() {
		this.createPage = true;
	}
	createNewEnv() {
		this.createEnv = true;
	}
	createNewEle() {
		this.createEle = true;
	}
	createNewVar() {
		this.createVar = true;
		this.showVar = false;
	}
	//Create new page end

	// Upload File Select Scenario's
	onSelectFile($event) {
		const fileList: FileList = $event.target.files;
		this.upldScnrioFile = fileList[0];
		this.scnrioFile = this.upldScnrioFile.name;
	}

	createScenario() {
		const formData: FormData = new FormData();
		formData.append('file', this.upldScnrioFile, this.upldScnrioFile.name);
		this.appservice.postByFileWithData('/scenario/importExcel', formData, {}).subscribe(res => {
			if (res.error && !_.isEmpty(res.error))
				this.utils.setToast('error', res.error.join('<br/>'), 'Error');
			else
				this.utils.setToast('success', 'Successfully created', 'Create');
		}, error => {
			this.utils.setToast('error', "Excel might be updated. Please try again", 'Error');
		});
		this.dialogRef.close();
	}

	// 
	generateScenarios() {
		const formData: FormData = new FormData();
		formData.append('file', this.upldScnrioFile, this.upldScnrioFile.name);
		// let reqData = {
		// 	TcMId: this.actvNode.DTP_Mod_ID,
		// 	key: this.authUserData.token
		// }
		// this.loader = true;
		// this.loaders = true;
		// this.appservice.postByFileWithData('/uploadScenario', formData, reqData)
		// 	.subscribe(res => {
		// 		if (res.data !== null && res.error === null) {
		// 			if (res.data.code === 101 && res.data.line) {
		// 				this.shiftData = true;
		// 				this.shiftArray = res.data.line;
		// 				this.utils.setToast('warning', 'Uploaded Data Error', 'Warning');
		// 				this.upldScnrioFile = undefined;
		// 				this.scnrioFile = undefined;
		// 				this.loader = false;
		// 				this.loaders = false;
		// 			} else {
		// 				this.shiftData = false;
		// 				this.shiftArray = undefined;
		// 				this.utils.setToast('success', 'Successfully Uploaded', 'Success');
		// 				this.upldScnrioFile = undefined;
		// 				this.scnrioFile = undefined;
		// 				this.isActive(this.actvNode);
		// this.getTreeData();
		// 				this.loader = false;
		// 				this.loaders = false;
		// 			}
		// 		} else {
		// 			this.utils.setToast('error', 'Upload Error please try again', 'Error');
		// 			$('.modal').css({ 'z-index': 1050 });
		// 			this.loader = false;
		// 			this.loaders = false;
		// 		}
		// 	})
	}

	// Test Run now
	runNow(plan) {
		let reqObj = { runId: plan.planId, scSuiteId: this.data.scSuiteID, planId: this.data.scId };
		this.appservice.postData('/testrun', reqObj)
			.subscribe((res) => {
				if (res.data && res.data.schdlId) {
					if (res.data.code === 201)
						this.utils.setToast('error', "Error in schedule a run", 'ERROR');
					else
						this.utils.setToast('success', "Successfully scheduled a run", 'SUCCESS');
					this.dialogRef.close({ schdlId: res.data.schdlId });
					this.appservice.scheduleRun();
					// this.resultsList({}, this.searchTx, event.pageIndex);
				} else {
					this.utils.setToast('warning', "Something Failed Please Try again later.", 'FAILED');
					this.dialogRef.close(null);
					
				};
			}, (err) => {
				this.utils.setToast('error', "Internal server error", 'ERROR');
			});
	}

	// isAllSelected() {
	// 	const numSelected = this.selection.selected.length;
	// 	const numRows = this.filteredRdata.filteredData.length;
	// 	return numSelected === numRows;
	//   }

	isAllSelected() {
		const numSelected = this.selection.selected.length;
		let numRows;
		if (this.data.type === "MODSCE") {
			numRows = this.filterscenario.filteredData.length;
		} else {
			numRows = this.filteredRdata.filteredData.length;
		}
		return numSelected === numRows;
	}

	masterToggle() {
		this.masterToggleClicked = true;
		if (this.isAllSelected()) {
		  this.selection.clear();
		} else {
		  //this.filteredRdata.filteredData.forEach(row => this.selection.select(row));
		  if(this.data.type==="MODSCE"){
			this.filterscenario.filteredData.forEach(row => this.selection.select(row));
			}else{
			this.filteredRdata.filteredData.forEach(row => this.selection.select(row));
			}
		}
		this.appservice.selectedItems = this.selection.selected;
	  }
 
	selectedItemsIds(itemId: any): boolean {
		return this.appservice.selectedItems.map(ids=> ids._id).includes(itemId);
	}

	getLocName(eve) {
		//'^[\p{L}][0-9a-zA-Z].*$' old pattern
		if (eve !== '' && eve.match('^[^\s][\p{L}][0-9a-zA-Z].*$') !== null && eve.trim() !== "") {
			this.isvalidLocName = false;
		} else {
			this.isvalidLocName = true;
		}
	}

	applyFilter(filterValue: any) {
		if (filterValue && filterValue.length > 0) {
			const pl = _.filter(this.data.plans, e => ((e.name.trim()).toLowerCase()).includes(filterValue.trim().toLowerCase()));
			this.filteredRunPlan = pl;
		} else {
			this.filteredRunPlan = this.data.plans;
		}
	}

	applyFilterScen(filterValue: any){
		if (filterValue && filterValue.length > 0) {
			const pl = _.filter(this.data.scenariosList, e => ((e.name.trim()).toLowerCase()).includes(filterValue.trim().toLowerCase()));
			this.filterscenario = new MatTableDataSource(pl);
		} else {
			this.filterscenario = new MatTableDataSource(this.data.scenariosList);
		}
		this.scePaginator.pageIndex = 0;
    	this.filterscenario.paginator = this.scePaginator;
	}
	importScenario(eve) {
		this.showImpMdl = false;
		this.appservice.postData('/scenario/import', { issueType: eve.value })
			.subscribe(res => {
				if (res.data.err) {
					this.showImpMdl = true;
					this.scLength = 0;
					this.filteredRdata = new MatTableDataSource([]);
					this.utils.setToast('error', res.data.err, 'Error');
				} else if (!_.isEmpty(res.data)) {
					this.showImpMdl = res.data.length > 0 ? false : true;
					this.scLength = res.data.length;
					this.filteredRdata = new MatTableDataSource(res.data);
					this.filteredRdata.paginator = this.scimpPaginator;
				} else {
					this.showImpMdl = true;
					this.scLength = 0;
					this.filteredRdata = new MatTableDataSource([]);
					let msg = res.data.msg ? res.data.msg : 'No scenario(s) to import'
					this.utils.setToast('info', msg, 'Info');
				}
			}, (err) => {
				this.showImpMdl = true;
				this.scLength = 0;
				this.filteredRdata = new MatTableDataSource([]);
				this.utils.setToast('error', err.error.err, 'Error');
			});
	}

	projectlist(){
	 let id= localStorage.getItem('rt-UserProfile') ? (JSON.parse(localStorage.getItem('rt-UserProfile')).tokenToolId) : '';
		this.appservice.postData('/getProjects', {tool_id:id}).subscribe(res => {
			this.prjlist = res.data.projects;
			// this.currentProjectName = localStorage.getItem('rt-PrjName');
			// if (this.prjlist && this.currentProjectName) {
			// 	this.prjlist = this.prjlist.filter(prj => prj.prjName !== this.currentProjectName);
			// }
		})
	}

	updateSelectedItems(element: any) {
		this.selection.toggle(element);
		const checkedItems = this.selection.selected.filter(item => {
			return this.selection.isSelected(item);
		  });

		this.appservice.selectedItems = [];
		this.appservice.selectedItems.push(...checkedItems);
	
	}
	
	exportProject(){
		if (this.appservice.selectedItems.length == 0) {
			this.utils.setToast('warning', 'No scenarios selected for export. Please select at least one scenario', 'Warning');
			return;
		} 
		
		this.selected_sub_scenarios = this.appservice.selectedItems.filter((item, index, self) =>
			index === self.findIndex((t) => (
				t._id === item._id
			))
		);

		let reqObject = {
			ids: this.selected_sub_scenarios.map(ids=> ids._id),
			destProj: this.prjNames.project_id,
			project_code:  this.prjNames.code
		}

		//api call from here

		this.appservice.postData('/moduleMovement', reqObject).
		subscribe((res) => {
            if (res.error) {
              this.utils.setToast('warning', res.error,'Warning');
              }
           else{
            this.utils.setToast('success', "The selected scenarios have been successfully copied.",'SUCCESS');
           } 
          
          }, (err) => {
            this.utils.setToast('error', err, 'Error');
          });
		
	}
	onSelectionchange() {
		this.selectedProjectName = this.prjNames.prjName;
		let current = this.currentProjectName.replace(/^"|"$/g,'');
		this.showError = (this.selectedProjectName == current);
	  }

}
