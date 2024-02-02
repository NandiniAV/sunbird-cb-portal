import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core'
import { GbSearchService } from '../../services/gb-search.service'
import { ConfigurationsService, EventService, ValueService } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
// tslint:disable-next-line
import _ from 'lodash'
import { TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'ws-app-learn-search',
  templateUrl: './learn-search.component.html',
  styleUrls: ['./learn-search.component.scss'],
})
export class LearnSearchComponent implements OnInit, OnChanges, OnDestroy {
  @Input() param: any
  @Input() userValue = ''
  @Input() paramFilters: any = []
  @Input() filtersPanel!: string
  searchResults: any = []
  searchRequestObject = {
    request: {
      filters: {
        contentType: [],
        primaryCategory: [],
        mimeType: [],
        source: [],
        mediaType: [],
        status: ['Live'],
        'competencies_v3.name': [],
        topics: [],
      },
      query: '',
      sort_by: { lastUpdatedOn: 'desc' },
      fields: [],
      facets: ['primaryCategory', 'mimeType', 'source', 'competencies_v3.name', 'topics'],
      limit: 100,
      offset: 0,
      fuzzy: false,
    },
  }
  totalResults: any
  defaultThumbnail = ''
  myFilters: any = []
  rfilter: any
  primaryCategoryType: any = []
  contentType: any = [] // now using as primaryCategory
  mimeType: any = []
  sourceType: any = []
  mediaType: any = []
  competencNames: any = []
  facets: any = []
  throttle = 100
  scrollDistance = 0.2
  limit = 100
  page = 0
  totalpages!: number | 0
  newQueryParam: any

  sideNavBarOpened = true
  private defaultSideNavBarOpenedSubscription: any

  public screenSizeIsLtMedium = false
  isLtMedium$ = this.valueSvc.isLtMedium$
  statedata: {
    param: any, path: any
  } | undefined
  resultFacets: any = []
  facetsData: any = []
  veifiedKarmayogi = false

  constructor(
    private searchSrvc: GbSearchService,
    private configSvc: ConfigurationsService,
    private events: EventService,
    private activated: ActivatedRoute,
    private valueSvc: ValueService,
    private translate: TranslateService
  ) {
    if (localStorage.getItem('websiteLanguage')) {
      this.translate.setDefaultLang('en')
      const lang = localStorage.getItem('websiteLanguage')!
      this.translate.use(lang)
    }
   }

  ngOnInit() {
    this.statedata = { param: this.param, path: 'Search' }
    const instanceConfig = this.configSvc.instanceConfig
    this.defaultSideNavBarOpenedSubscription = this.isLtMedium$.subscribe(isLtMedium => {
      this.sideNavBarOpened = !isLtMedium
      this.screenSizeIsLtMedium = isLtMedium

    })

    if (instanceConfig) {
      this.defaultThumbnail = instanceConfig.logos.defaultContent || ''
    }
    if (!this.activated.snapshot.data.searchPageData) {
      this.searchSrvc.getSearchConfig().then(data => {
        this.activated.snapshot.data = {
          searchPageData: { data },
        }
        this.facets = data.defaultsearch
      })
    } else {
      this.facets = this.activated.snapshot.data.searchPageData.data.defaultsearch
      if (this.param === 'moderatedCourses') {
        for (const key in this.facets[0].values) {
          if (this.facets[0].values[key].name === 'moderated courses') {
            this.facets[0].values[key].ischecked = true
            const obj = {
              mainType: 'primaryCategory',
              name: 'moderated courses',
              count: 0,
              ischecked: true,
            }
            this.myFilters.push(obj)
          }
        }
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.configSvc.unMappedUser && this.configSvc.unMappedUser.profileDetails) {
      this.veifiedKarmayogi = this.configSvc.unMappedUser.profileDetails.verifiedKarmayogi
    }
    if (changes.param.currentValue !== changes.param.previousValue) {
      this.statedata = { param: this.param, path: 'Search' }
      this.searchResults = []
      this.totalResults = 0
      if (this.myFilters && this.myFilters.length > 0) {
        this.myFilters.forEach((fil: any) => {
          this.removeFilter(fil)
        })
      }
      this.getStartupData()
    }
  }

  getFacets(facets: any) {
    facets.forEach((item: any) => {
      this.facets.forEach((fitem: any) => {
        if (item.name === fitem.name && item.name === 'source') {
          fitem.values = item.values
          fitem.values.forEach((val: any) => {
            const ispresent = this.myFilters.filter((x: any) => x.name === val.name)
            if (ispresent.length > 0) {
              val.ischecked = true
            } else  {
              val.ischecked = false
            }
          })
        }
      })
    })
  }

  getStartupData() {
    if (!this.paramFilters || this.paramFilters === 'undefined') {
      this.paramFilters = []
     }
     if (this.paramFilters && this.paramFilters.length > 0) {
       this.paramFilters.forEach((pf: any) => {
         const indx = this.myFilters.filter((x: any) => x.name === pf.name)
         if (indx.length === 0) {
           this.myFilters.push(pf)
         }
       })
       this.applyFilter(this.paramFilters)
     } else {
      this.getSearchedData()
    }
  }

  getSearchedData() {
    if (this.myFilters.length === 0 && this.paramFilters.length === 0) {
      // let param = ''
      // if (this.userValue === 'moderatedCourses') {
      //   param = ''
      // }

      const queryparam1 = {
        request: {
          secureSettings: true,
          query: this.param,
          filters: {
            primaryCategory: ['Course'],
            status: ['Live'],
          },
          sort_by: { lastUpdatedOn: 'desc' },
          facets: ['mimeType'],
          limit: 20,
        },
      }

      let queryparam2

      if (this.userValue === 'moderatedCourses') {
        if (this.veifiedKarmayogi) {
          this.searchApiCall(queryparam1)
        }
      } else {
        // if (this.userValue === 'moderatedCourses') {
        //   param = ''
        // }
        queryparam2 = {
          request: {
            filters: {
              primaryCategory: [
                'Course',
                'Program',
                'Standalone Assessment',
                'Blended Program',
                'Curated Program',
              ],
              status: ['Live'],
            },
            query: this.param,
            sort_by: { lastUpdatedOn: '' },
            fields: [],
            facets: ['primaryCategory', 'mimeType', 'source'],
            limit: 100,
            offset: 0,
            fuzzy: false,
          },
        }
        if (this.veifiedKarmayogi) {
          this.searchApiCall(queryparam1)
        }
        this.searchApiCall(queryparam2)
      }

    }
    // if ((this.paramFilters && this.paramFilters.length > 0) || (this.myFilters && this.myFilters.length > 0)) {
    // queryparam.request.filters = this.paramFilters
    //   if (this.paramFilters.contentType) {
    //     const pf = {
    //       mainType:  'primaryCategory',
    //       name: this.paramFilters.primaryCategory[0].toLowerCase(),
    //       count: '',
    //       ischecked: true,
    //     }
    //     this.paramFilters = pf
    //     this.searchSrvc.addFilter(pf)
    //     this.myFilters.push(pf)
    //   }
    // }
    // this.paramFilters.forEach((pf: any) => {
    //   const indx = this.myFilters.filter((x: any) => x.name === pf.name)
    //   if (indx.length === 0) {
    //     this.myFilters.push(pf)
    //   }
    // })
    // this.searchSrvc.fetchSearchData(queryparam).subscribe((response: any) => {
    // this.facets = response.result.facets
    // if (response) { }
    // this.applyFilter(this.paramFilters)
    // })
    // }
  }

  searchApiCall(queryparam: any) {
    this.newQueryParam = queryparam
    this.searchResults = []
    this.totalResults = 0
    this.searchSrvc.fetchSearchData(queryparam).subscribe((response: any) => {
      if (response && response.result && response.result.count > 0) {
        response.result.content.forEach((data: any) => {
          this.searchResults.push(data)
        })
      }
      this.totalResults = this.totalResults + response.result.count
      // this.facets = response.result.facets
      this.paramFilters = []
      this.totalpages = Math.ceil(this.totalResults / 100)
      this.facetsData.push(response.result.facets)
      this.getFacets(this.facetsData)
    })

  }

  // viewContent(content: any) {
  // this.router.navigate([`/app/toc/${content.identifier}/overview?primaryCategory=/${content.primaryCategory}`])
  // }

  applyFilter(filter: any) {
    let isFilterCheccked = false
    let isModeratedFilterChecked = false
    if (filter && filter.length > 0) {
      this.myFilters = filter
      const queryparam = this.searchRequestObject
      queryparam.request.filters.primaryCategory = []
      queryparam.request.filters.contentType = []
      queryparam.request.filters.mimeType = []
      queryparam.request.filters.source = []
      this.myFilters.forEach((mf: any) => {
        queryparam.request.query = this.param
        if (mf.mainType === 'contentType') {
          // const indx = this.contentType.filter((x: any) => x === mf.name)
          // if (indx.length === 0) {
          //   this.contentType.push(mf.name)
          //   queryparam.request.filters.contentType = this.contentType
          // }
          // queryparam.request.filters.contentType = this.contentType
          const indx = this.primaryCategoryType.filter((x: any) => x === mf.name && mf.name !== 'moderated courses')
          if (indx.length === 0) {
            if (mf.name !== 'moderated courses') {
              this.primaryCategoryType.push(mf.name)
              queryparam.request.filters.primaryCategory = this.primaryCategoryType
            }
          }
          queryparam.request.filters.primaryCategory = this.primaryCategoryType
        } else if (mf.mainType === 'primaryCategory') {
          const indx = this.primaryCategoryType.filter((x: any) => x === mf.name && mf.name !== 'moderated courses')
          if (indx.length === 0) {
            if (mf.name !== 'moderated courses') {
              this.primaryCategoryType.push(mf.name)
              queryparam.request.filters.primaryCategory = this.primaryCategoryType
            }
          }
          queryparam.request.filters.primaryCategory = this.primaryCategoryType
        } else if (mf.mainType === 'mimeType') {
          if (mf.name === 'Image') {
            this.mimeType.push('image/jpeg')
            this.mimeType.push('image/png')
          } else if (mf.name === 'Video') {
            this.mimeType.push('video/mp4')
            this.mimeType.push('video/x-youtube')
            this.mimeType.push('application/x-mpegURL')
          } else if (mf.name === 'Assessment') {
            this.mimeType.push('application/json')
            this.mimeType.push('application/quiz')
          } else if (mf.name === 'Interactive Content') {
            this.mimeType.push('application/vnd.ekstep.html-archive')
            this.mimeType.push('application/vnd.ekstep.ecml-archive')
          } else if (mf.name === 'Pratice / Final Assessment') {
            this.mimeType.push('application/vnd.sunbird.questionset')
          } else {
            this.mimeType.push(mf.name)
          }
          queryparam.request.filters.mimeType = this.mimeType
        } else if (mf.mainType === 'source') {
          this.sourceType.push(mf.name)
          queryparam.request.filters.source = this.sourceType
        } else if (mf.mainType === 'mediaType') {
          this.mediaType.push(mf.name)
          queryparam.request.filters.mediaType = this.mediaType
        } else if (mf.mainType === 'competencies_v3.name') {
          this.competencNames = (mf.values)
          queryparam.request.filters['competencies_v3.name'] = mf.values
        } else if (mf.mainType === 'topics') {
          this.competencNames = (mf.values)
          queryparam.request.filters['topics'] = mf.values
        }
        if (mf.name === 'moderated courses') {
          isModeratedFilterChecked = true
        }
        if (mf.name !== 'moderated courses') {
          isFilterCheccked = true
        }
      })

      // if (queryparam.request.filters.contentType.length === 0) {
        // this.contentType.push('Course')
        // this.contentType.push('Resource')
        // this.contentType.push('Program')
        // queryparam.request.filters.contentType = this.contentType
      // }

      if (isModeratedFilterChecked) {
        this.primaryCategoryType.push('Course')
        queryparam.request.filters.primaryCategory = this.primaryCategoryType
      } else if (queryparam.request.filters.primaryCategory.length === 0 && !isModeratedFilterChecked) {
        this.primaryCategoryType.push('Course')
        this.primaryCategoryType.push('Program')
        this.primaryCategoryType.push('Standalone Assessment')
        queryparam.request.filters.primaryCategory = this.primaryCategoryType
      }

      if (this.param && this.param !== 'moderatedCourses') {
        queryparam.request.query = this.param
      } else {
        queryparam.request.query = ''
      }
      // this.facets = []
      this.searchResults = []
      this.totalResults = 0
      this.newQueryParam = queryparam

      if (isModeratedFilterChecked) {
        const param = {
              request: {
              secureSettings: true,
              query: this.param,
                filters: {
                  primaryCategory: [
                    'Course',

                  ],
                  status: ['Live'],
                },
                sort_by: { lastUpdatedOn: 'desc' },
                facets: ['mimeType'],
                limit: 20,

              },
            }
            this.fetchSearchDataFun(param)
      }

      if (isFilterCheccked) {
        this.fetchSearchDataFun(queryparam)
      }
    } else {
      this.myFilters = filter
      this.getSearchedData()
    }
  }

  fetchSearchDataFun(data: any) {
    this.searchSrvc.fetchSearchData(data).subscribe((response: any) => {
      response.result.content.forEach((res: any) => {
        this.searchResults.push(res)
      })
      this.totalResults = response.result.count + this.totalResults
      // this.facets = response.result.facets
      this.primaryCategoryType = []
      this.contentType = []
      this.mimeType = []
      this.sourceType = []
      this.mediaType = []
      this.paramFilters = []
      this.totalpages = Math.ceil(this.totalResults / 100)
      this.resultFacets.push(response.result.facets)
      this.getFacets(this.resultFacets)
    })
  }

  removeFilter(mfilter: any) {
    this.rfilter = mfilter
    this.searchSrvc.notifyOther(this.rfilter)
  }

  raiseTelemetry(content: any) {
    if (content) {
      this.events.raiseInteractTelemetry(
        {
          type: 'click',
          subType: `card-learnSearch`,
          id: `${_.camelCase(content.primaryCategory)}-card`,
        },
        {
          id: content.identifier || '',
          type: content.primaryCategory,
          rollup: {},
          ver: `${content.version}${''}`,
        },
        {
          pageIdExt: `${content.primaryCategory}-card`,
          module: content.primaryCategory,
      })
    }
  }

  onScrollEnd() {
    this.page += 1
    if (this.page <= this.totalpages && this.searchResults.length < this.totalResults) {
      const queryparam = this.newQueryParam
      queryparam.request.offset += 100
      this.searchSrvc.fetchSearchData(queryparam).subscribe((response: any) => {
        const array2 = response.result.content
        this.searchResults = this.searchResults.concat(array2)
      })
    }
  }

  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe()
    }

  }
}
