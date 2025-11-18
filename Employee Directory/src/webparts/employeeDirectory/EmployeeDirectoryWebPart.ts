import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneToggle,
  IPropertyPaneDropdownOption
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import { MSGraphClientV3, MSGraphClientFactory } from '@microsoft/sp-http';

import styles from './EmployeeDirectoryWebPart.module.scss';
import { GraphService } from './services/GraphService';
import { IEmployee, IAzureADGroup } from './models/IEmployee';

export interface IEmployeeDirectoryWebPartProps {
  selectedGroupId: string;
  enableLazyLoading: boolean;
}

export default class EmployeeDirectoryWebPart extends BaseClientSideWebPart<IEmployeeDirectoryWebPartProps> {

  private graphClient: MSGraphClientV3;
  private graphService: GraphService;
  private groups: IAzureADGroup[] = [];
  private employees: IEmployee[] = [];
  private filteredEmployees: IEmployee[] = [];
  private displayedEmployees: IEmployee[] = [];
  private isLoading: boolean = false;
  private isLoadingInBackground: boolean = false;
  private loadingProgress: number = 0;
  private loadingTotal: number = 0;
  private initialLoadThreshold: number = 40;
  private searchQuery: string = '';
  private selectedJobTitle: string = 'all';
  private selectedDepartment: string = 'all';
  private selectedLocation: string = 'all';
  private itemsPerPage: number = 12;
  private currentPage: number = 1;
  private selectedEmployee: IEmployee | null = null;
  private isModalOpen: boolean = false;
  private shouldRestoreFocus: boolean = false;

  protected async onInit(): Promise<void> {
    await super.onInit();

    // Initialize Graph Client
    const factory: MSGraphClientFactory = this.context.msGraphClientFactory;
    this.graphClient = await factory.getClient('3');
    this.graphService = new GraphService(this.graphClient);

    // Load employees if group is selected
    if (this.properties.selectedGroupId) {
      await this.loadEmployees();
    }
  }

  public render(): void {
    const activeElementId = document.activeElement?.id;

    // If loading in background, update the notification content without removing it
    if (this.isLoadingInBackground) {
      const existingNotification = this.domElement.querySelector('.background-notification');
      if (existingNotification) {
        // Just update the content to avoid flickering
        existingNotification.innerHTML = this.getBackgroundLoadingNotificationHTML();
      } else {
        // First time - create and add the notification
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'background-notification';
        notificationDiv.innerHTML = this.getBackgroundLoadingNotificationHTML();
        this.domElement.appendChild(notificationDiv);
      }
    } else {
      this.domElement.innerHTML = this.getHTML() + this.getModalHTML();
      this.attachEventListeners();
    }

    // Restore focus to search input if it was focused before render
    if (this.shouldRestoreFocus && activeElementId === 'searchInput') {
      const searchInput = this.domElement.querySelector('#searchInput') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        // Restore cursor position to end
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    }
    this.shouldRestoreFocus = false;
  }

  private getHTML(): string {
    if (!this.properties.selectedGroupId) {
      return this.getNoGroupSelectedHTML();
    }

    if (this.isLoading) {
      return this.getLoadingHTML();
    }

    return this.getEmployeeDirectoryHTML();
  }

  private getNoGroupSelectedHTML(): string {
    return `
      <div class="${styles.employeeDirectory}">
        <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0078d4" stroke-width="2" style="margin: 0 auto 16px;">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h2 style="color: #323130; margin-bottom: 8px;">No Azure AD Group Selected</h2>
          <p style="color: #605e5c; margin-bottom: 20px;">Please configure the web part and select an Azure AD group to display employees.</p>
          <button class="ms-Button ms-Button--primary" onclick="window.dispatchEvent(new CustomEvent('openPropertyPane'))">
            <span class="ms-Button-label">Configure</span>
          </button>
        </div>
      </div>
    `;
  }

  private getLoadingHTML(): string {
    const percentage = this.loadingTotal > 0
      ? Math.round((this.loadingProgress / this.loadingTotal) * 100)
      : 0;

    return `
      <div class="${styles.employeeDirectory}">
        <div class="${styles.loadingOverlay}">
          <div class="${styles.loadingContent}">
            <div class="${styles.spinner}">
              <div class="${styles.spinnerCircle}"></div>
            </div>
            <h2 style="color: #323130; margin: 24px 0 8px;">
              Loading Employee Directory
            </h2>
            <p style="color: #605e5c; margin-bottom: 16px;">
              Fetching employee data from Azure AD...
            </p>
            <div class="${styles.progressBar}">
              <div class="${styles.progressFill}" style="width: ${percentage}%"></div>
            </div>
            <p style="color: #605e5c; font-size: 14px; margin-top: 8px;">
              ${this.loadingProgress} / ${this.loadingTotal} (${percentage}%)
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private getBackgroundLoadingNotificationHTML(): string {
    const percentage = this.loadingTotal > 0
      ? Math.round((this.loadingProgress / this.loadingTotal) * 100)
      : 0;

    return `
      <div class="${styles.backgroundNotification}">
        <div class="${styles.notificationHeader}">
          <div class="${styles.notificationTitle}">
            <div class="${styles.miniSpinner}">
              <div class="${styles.miniSpinnerCircle}"></div>
            </div>
            <span>Loading Employees</span>
          </div>
        </div>
        <div class="${styles.notificationBody}">
          <div class="${styles.notificationProgress}">
            <div class="${styles.notificationProgressBar}">
              <div class="${styles.notificationProgressFill}" style="width: ${percentage}%"></div>
            </div>
            <div class="${styles.notificationText}">
              Fetched ${this.loadingProgress} of ${this.loadingTotal} employees (${percentage}%)
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getEmployeeDirectoryHTML(): string {
    const jobTitles = this.getAvailableJobTitles();
    const departments = this.getAvailableDepartments();
    const locations = this.getAvailableLocations();

    return `
      <div class="${styles.employeeDirectory}">
        <!-- Search and Filters -->
        <div class="${styles.filterContainer}">
          <div class="${styles.searchBar}">
            <svg class="${styles.searchIcon}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              id="searchInput"
              class="${styles.searchInput}"
              placeholder="Search by name, job title, department, or email..."
              value="${this.searchQuery}"
            />
            ${this.searchQuery ? `
              <button id="clearSearch" class="${styles.clearButton}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            ` : ''}
          </div>

          <div class="${styles.filters}">
            <div class="${styles.filterGroup}">
              <label class="${styles.filterLabel}">Job Title</label>
              <select id="jobTitleFilter" class="${styles.filterSelect}">
                <option value="all" ${this.selectedJobTitle === 'all' ? 'selected' : ''}>All Job Titles</option>
                ${jobTitles.map(title => `
                  <option value="${title}" ${this.selectedJobTitle === title ? 'selected' : ''}>${title}</option>
                `).join('')}
              </select>
            </div>

            <div class="${styles.filterGroup}">
              <label class="${styles.filterLabel}">Department</label>
              <select id="departmentFilter" class="${styles.filterSelect}">
                <option value="all" ${this.selectedDepartment === 'all' ? 'selected' : ''}>All Departments</option>
                ${departments.map(dept => `
                  <option value="${dept}" ${this.selectedDepartment === dept ? 'selected' : ''}>${dept}</option>
                `).join('')}
              </select>
            </div>

            <div class="${styles.filterGroup}">
              <label class="${styles.filterLabel}">Office Location</label>
              <select id="locationFilter" class="${styles.filterSelect}">
                <option value="all" ${this.selectedLocation === 'all' ? 'selected' : ''}>All Locations</option>
                ${locations.map(loc => `
                  <option value="${loc}" ${this.selectedLocation === loc ? 'selected' : ''}>${loc}</option>
                `).join('')}
              </select>
            </div>
          </div>

          ${this.hasActiveFilters() ? `
            <div class="${styles.clearFilters}">
              <button id="clearFilters" class="${styles.clearFiltersButton}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear All Filters
              </button>
            </div>
          ` : ''}

          <div class="${styles.resultsCount}">
            Showing <span style="color: #0078d4; font-weight: 600;">${this.filteredEmployees.length}</span> of ${this.employees.length} employees
          </div>
        </div>

        <!-- Employee Grid -->
        <div class="${styles.employeeGrid}">
          ${this.filteredEmployees.length > 0
        ? this.displayedEmployees.map(emp => this.getEmployeeCardHTML(emp)).join('')
        : this.getNoResultsHTML()
      }
        </div>

        <!-- Load More Button -->
        ${this.properties.enableLazyLoading && this.displayedEmployees.length < this.filteredEmployees.length ? `
          <div class="${styles.loadMoreContainer}">
            <button id="loadMoreBtn" class="${styles.loadMoreButton}">
              <span>Load More</span>
              <span class="${styles.loadMoreCount}">(${this.filteredEmployees.length - this.displayedEmployees.length} remaining)</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  private getEmployeeCardHTML(employee: IEmployee): string {
    const initials = `${employee.givenName.charAt(0)}${employee.surname.charAt(0)}`.toUpperCase();
    const phone = employee.businessPhones?.[0] || employee.mobilePhone || 'N/A';

    return `
      <div class="${styles.employeeCard}" data-employee-id="${employee.id}">
        <div class="${styles.cardHeader}">
          <div class="${styles.avatar}">
            ${employee.photo
        ? `<img src="${employee.photo}" alt="${employee.displayName}" class="${styles.avatarImage}" />`
        : `<div class="${styles.avatarFallback}">${initials}</div>`
      }
          </div>
          <div class="${styles.cardInfo}">
            <h3 class="${styles.employeeName}">${employee.displayName}</h3>
            <div class="${styles.employeeDetail}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>${employee.jobTitle}</span>
            </div>
            <div class="${styles.employeeDetail}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              <span>${employee.department}</span>
            </div>
          </div>
        </div>
        <div class="${styles.cardBody}">
          <div class="${styles.employeeDetail}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${employee.officeLocation}</span>
          </div>
          <div class="${styles.employeeDetail}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <a href="mailto:${employee.mail}" class="${styles.link}">${employee.mail}</a>
          </div>
          <div class="${styles.employeeDetail}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>${phone}</span>
          </div>
        </div>
      </div>
    `;
  }

  private getNoResultsHTML(): string {
    return `
      <div class="${styles.noResults}">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#a19f9d" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <h3>No employees found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
  }

  private getModalHTML(): string {
    if (!this.isModalOpen || !this.selectedEmployee) {
      return '';
    }

    const employee = this.selectedEmployee;
    const initials = `${employee.givenName.charAt(0)}${employee.surname.charAt(0)}`.toUpperCase();
    const phone = employee.businessPhones?.[0] || employee.mobilePhone || 'N/A';
    const manager = employee.managerId ? this.employees.find(emp => emp.id === employee.managerId) : null;
    const directReports = (employee.directReports || [])
      .map(id => this.employees.find(emp => emp.id === id))
      .filter(emp => emp !== null) as IEmployee[];

    return `
      <div class="${styles.modalOverlay}" id="modalOverlay">
        <div class="${styles.modalContent}" id="modalContent">
          <div class="${styles.modalHeader}">
            <h2 class="${styles.modalTitle}">Employee Profile</h2>
            <button class="${styles.modalClose}" id="modalClose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="${styles.modalBody}">
            <!-- Header Section -->
            <div class="${styles.modalProfileHeader}">
              <div class="${styles.modalAvatar}">
                ${employee.photo
                  ? `<img src="${employee.photo}" alt="${employee.displayName}" class="${styles.avatarImage}" />`
                  : `<div class="${styles.avatarFallback}">${initials}</div>`
                }
              </div>
              <div class="${styles.modalProfileInfo}">
                <h3>${employee.displayName}</h3>
                <p class="${styles.modalJobTitle}">${employee.jobTitle}</p>
                <div class="${styles.modalBadges}">
                  <span class="${styles.badge}">${employee.department}</span>
                  <span class="${styles.badge} ${styles.badgeOutline}">${employee.officeLocation}</span>
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="${styles.modalSection}">
              <h4>Contact Information</h4>
              <div class="${styles.modalContactGrid}">
                <div class="${styles.modalContactItem}">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <div>
                    <p class="${styles.contactLabel}">Email</p>
                    <a href="mailto:${employee.mail}" class="${styles.link}">${employee.mail}</a>
                  </div>
                </div>
                <div class="${styles.modalContactItem}">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <div>
                    <p class="${styles.contactLabel}">Phone</p>
                    <a href="tel:${phone}" class="${styles.link}">${phone}</a>
                  </div>
                </div>
                <div class="${styles.modalContactItem}">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div>
                    <p class="${styles.contactLabel}">Office Location</p>
                    <p>${employee.officeLocation}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Organizational Structure -->
            <div class="${styles.modalSection}">
              <h4>Organizational Structure</h4>
              <div class="${styles.modalOrgGrid}">
                <div class="${styles.modalOrgCard}">
                  <div class="${styles.modalOrgCardHeader}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Reports To</span>
                  </div>
                  ${manager ? `
                    <div class="${styles.modalManagerInfo}">
                      <div class="${styles.modalSmallAvatar}">
                        ${manager.photo
                          ? `<img src="${manager.photo}" alt="${manager.displayName}" />`
                          : `<div class="${styles.avatarFallback}">${manager.givenName.charAt(0)}${manager.surname.charAt(0)}</div>`
                        }
                      </div>
                      <div>
                        <p class="${styles.modalManagerName}">${manager.displayName}</p>
                        <p class="${styles.modalManagerTitle}">${manager.jobTitle}</p>
                      </div>
                    </div>
                  ` : `<p class="${styles.modalNoData}">No direct manager</p>`}
                </div>
                <div class="${styles.modalOrgCard} ${styles.modalOrgCardGreen}">
                  <div class="${styles.modalOrgCardHeader}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>Direct Reports</span>
                  </div>
                  <p class="${styles.modalOrgCount}">${directReports.length}</p>
                  <p class="${styles.modalOrgText}">${directReports.length === 1 ? 'person reports' : 'people report'} to ${employee.givenName}</p>
                </div>
              </div>
            </div>

            ${directReports.length > 0 ? `
              <div class="${styles.modalSection}">
                <h4>Team Members</h4>
                <div class="${styles.modalTeamList}">
                  ${directReports.map(report => `
                    <div class="${styles.modalTeamMember}">
                      <div class="${styles.modalSmallAvatar}">
                        ${report.photo
                          ? `<img src="${report.photo}" alt="${report.displayName}" />`
                          : `<div class="${styles.avatarFallback}">${report.givenName.charAt(0)}${report.surname.charAt(0)}</div>`
                        }
                      </div>
                      <div>
                        <p class="${styles.modalTeamMemberName}">${report.displayName}</p>
                        <p class="${styles.modalTeamMemberTitle}">${report.jobTitle}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const searchInput = this.domElement.querySelector('#searchInput') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        this.shouldRestoreFocus = true;
        this.applyFilters();
      });
    }

    const clearSearch = this.domElement.querySelector('#clearSearch');
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        this.searchQuery = '';
        this.applyFilters();
      });
    }

    const jobTitleFilter = this.domElement.querySelector('#jobTitleFilter') as HTMLSelectElement;
    if (jobTitleFilter) {
      jobTitleFilter.addEventListener('change', (e) => {
        this.selectedJobTitle = (e.target as HTMLSelectElement).value;
        this.applyFilters();
      });
    }

    const departmentFilter = this.domElement.querySelector('#departmentFilter') as HTMLSelectElement;
    if (departmentFilter) {
      departmentFilter.addEventListener('change', (e) => {
        this.selectedDepartment = (e.target as HTMLSelectElement).value;
        this.applyFilters();
      });
    }

    const locationFilter = this.domElement.querySelector('#locationFilter') as HTMLSelectElement;
    if (locationFilter) {
      locationFilter.addEventListener('change', (e) => {
        this.selectedLocation = (e.target as HTMLSelectElement).value;
        this.applyFilters();
      });
    }

    const clearFilters = this.domElement.querySelector('#clearFilters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    const loadMoreBtn = this.domElement.querySelector('#loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMore();
      });
    }

    // Employee card click handlers
    const employeeCards = this.domElement.querySelectorAll(`.${styles.employeeCard}`);
    employeeCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const employeeId = (e.currentTarget as HTMLElement).getAttribute('data-employee-id');
        if (employeeId) {
          this.openModal(employeeId);
        }
      });
    });

    // Modal close handlers
    const modalClose = this.domElement.querySelector('#modalClose');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        this.closeModal();
      });
    }

    const modalOverlay = this.domElement.querySelector('#modalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeModal();
        }
      });
    }
  }

  private openModal(employeeId: string): void {
    const employee = this.employees.find(emp => emp.id === employeeId);
    if (employee) {
      this.selectedEmployee = employee;
      this.isModalOpen = true;
      this.render();
    }
  }

  private closeModal(): void {
    this.isModalOpen = false;
    this.selectedEmployee = null;
    this.render();
  }

  private async loadEmployees(): Promise<void> {
    this.isLoading = true;
    this.isLoadingInBackground = false;
    this.loadingProgress = 0;
    this.loadingTotal = 0;
    this.render();

    try {
      // Start loading with progressive callback
      const employeesPromise = this.graphService.getGroupMembers(
        this.properties.selectedGroupId,
        (loaded, total) => {
          this.loadingProgress = loaded;
          this.loadingTotal = total;
          if (this.isLoadingInBackground) {
            this.render();
          }
        },
        (initialBatch: IEmployee[]) => {
          // Initial batch received - display immediately
          this.employees = [...initialBatch];
          this.filteredEmployees = [...this.employees];
          this.currentPage = 1;
          this.updateDisplayedEmployees();
          this.isLoading = false;
          this.isLoadingInBackground = true;
          this.render();
        },
        this.initialLoadThreshold,
        (updatedEmployees: IEmployee[]) => {
          // Progressive update - update employee list as new batches arrive
          this.employees = [...updatedEmployees];
          this.applyFiltersWithoutReset();
        }
      );

      // Wait for all employees to load
      const allEmployees = await employeesPromise;

      // Update with all employees
      this.employees = allEmployees;
      this.filteredEmployees = [...this.employees];
      this.currentPage = 1;
      this.updateDisplayedEmployees();
      this.isLoading = false;
      this.isLoadingInBackground = false;

      // Remove background notification
      const existingNotification = this.domElement.querySelector('.background-notification');
      if (existingNotification) {
        existingNotification.remove();
      }

      this.render();
    } catch (error) {
      console.error('Error loading employees:', error);
      this.isLoading = false;
      this.isLoadingInBackground = false;
      this.render();
    }
  }

  private applyFilters(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesSearch = this.searchQuery === '' ||
        employee.displayName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        employee.jobTitle.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        employee.department.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        employee.mail.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesJobTitle = this.selectedJobTitle === 'all' || employee.jobTitle === this.selectedJobTitle;
      const matchesDepartment = this.selectedDepartment === 'all' || employee.department === this.selectedDepartment;
      const matchesLocation = this.selectedLocation === 'all' || employee.officeLocation === this.selectedLocation;

      return matchesSearch && matchesJobTitle && matchesDepartment && matchesLocation;
    });

    // Reset pagination
    this.currentPage = 1;
    this.updateDisplayedEmployees();
    this.render();
  }

  private applyFiltersWithoutReset(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesSearch = this.searchQuery === '' ||
        employee.displayName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        employee.jobTitle.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        employee.department.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        employee.mail.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesJobTitle = this.selectedJobTitle === 'all' || employee.jobTitle === this.selectedJobTitle;
      const matchesDepartment = this.selectedDepartment === 'all' || employee.department === this.selectedDepartment;
      const matchesLocation = this.selectedLocation === 'all' || employee.officeLocation === this.selectedLocation;

      return matchesSearch && matchesJobTitle && matchesDepartment && matchesLocation;
    });

    // Don't reset pagination, just update displayed employees
    this.updateDisplayedEmployees();
  }

  private updateDisplayedEmployees(): void {
    if (this.properties.enableLazyLoading) {
      const endIndex = this.currentPage * this.itemsPerPage;
      this.displayedEmployees = this.filteredEmployees.slice(0, endIndex);
    } else {
      this.displayedEmployees = [...this.filteredEmployees];
    }
  }

  private loadMore(): void {
    this.currentPage++;
    this.updateDisplayedEmployees();
    this.render();
  }

  private clearAllFilters(): void {
    this.searchQuery = '';
    this.selectedJobTitle = 'all';
    this.selectedDepartment = 'all';
    this.selectedLocation = 'all';
    this.applyFilters();
  }

  private hasActiveFilters(): boolean {
    return this.searchQuery !== '' ||
      this.selectedJobTitle !== 'all' ||
      this.selectedDepartment !== 'all' ||
      this.selectedLocation !== 'all';
  }

  private getAvailableJobTitles(): string[] {
    let filtered = this.employees;

    if (this.selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === this.selectedDepartment);
    }

    if (this.selectedLocation !== 'all') {
      filtered = filtered.filter(emp => emp.officeLocation === this.selectedLocation);
    }

    const titles = new Set(filtered.map(emp => emp.jobTitle).filter(val => val && val !== 'N/A'));
    return Array.from(titles).sort();
  }

  private getAvailableDepartments(): string[] {
    let filtered = this.employees;

    if (this.selectedJobTitle !== 'all') {
      filtered = filtered.filter(emp => emp.jobTitle === this.selectedJobTitle);
    }

    if (this.selectedLocation !== 'all') {
      filtered = filtered.filter(emp => emp.officeLocation === this.selectedLocation);
    }

    const depts = new Set(filtered.map(emp => emp.department).filter(val => val && val !== 'N/A'));
    return Array.from(depts).sort();
  }

  private getAvailableLocations(): string[] {
    let filtered = this.employees;

    if (this.selectedJobTitle !== 'all') {
      filtered = filtered.filter(emp => emp.jobTitle === this.selectedJobTitle);
    }

    if (this.selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === this.selectedDepartment);
    }

    const locs = new Set(filtered.map(emp => emp.officeLocation).filter(val => val && val !== 'N/A'));
    return Array.from(locs).sort();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected async onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyPath === 'selectedGroupId' && oldValue !== newValue) {
      if (newValue) {
        await this.loadEmployees();
      }
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected async loadPropertyPaneResources(): Promise<void> {
    this.groups = await this.graphService.getGroups();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const groupOptions: IPropertyPaneDropdownOption[] = this.groups
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map(group => ({
        key: group.id,
        text: group.displayName
      }));

    return {
      pages: [
        {
          header: {
            description: 'Configure the Employee Directory settings'
          },
          groups: [
            {
              groupName: 'Data Source',
              groupFields: [
                PropertyPaneDropdown('selectedGroupId', {
                  label: 'Azure AD Group',
                  options: groupOptions,
                  selectedKey: this.properties.selectedGroupId
                }),
                PropertyPaneToggle('enableLazyLoading', {
                  label: 'Enable Lazy Loading',
                  checked: this.properties.enableLazyLoading,
                  onText: 'On',
                  offText: 'Off'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
