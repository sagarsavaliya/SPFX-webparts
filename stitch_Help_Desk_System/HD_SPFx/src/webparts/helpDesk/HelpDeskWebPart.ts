import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'HelpDeskWebPartStrings';
import { AppProvider } from './context/AppContext';
import { App } from './components/App';

export interface IHelpDeskWebPartProps {
  description: string;
  customCSS: string;
}

export default class HelpDeskWebPart extends BaseClientSideWebPart<IHelpDeskWebPartProps> {

  public render(): void {
    // Inject custom CSS if provided
    this._injectCustomCSS();

    // eslint-disable-next-line react/no-children-prop
    const element: React.ReactElement = React.createElement(
      AppProvider,
      { webPartContext: this.context, children: React.createElement(App, {}) }
    );

    ReactDom.render(element, this.domElement);
  }

  private _injectCustomCSS(): void {
    // Remove existing custom CSS if it exists
    const existingStyle = document.getElementById('helpdesk-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Only inject CSS if we're NOT in edit mode
    // Check multiple indicators to ensure we detect edit mode correctly
    const isEditMode = this.displayMode === 2 || // DisplayMode.Edit = 2
                       document.body.classList.contains('sp-editing') ||
                       document.querySelector('[data-automation-id="CanvasCommand"]') !== null ||
                       window.location.href.includes('Mode=Edit');

    // Only add custom CSS if NOT in edit mode and CSS is provided
    if (!isEditMode && this.properties.customCSS && this.properties.customCSS.trim()) {
      const style = document.createElement('style');
      style.id = 'helpdesk-custom-css';
      style.type = 'text/css';
      style.innerHTML = this.properties.customCSS;
      document.head.appendChild(style);
    }
  }

  protected onInit(): Promise<void> {
    // Add keyboard shortcut (Ctrl+Shift+E) to enter edit mode when SharePoint chrome is hidden
    this._addEditModeShortcut();
    return Promise.resolve();
  }

  private _addEditModeShortcut(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Ctrl+Shift+E to enter edit mode
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        // Redirect to edit mode
        const currentUrl = window.location.href.split('?')[0];
        window.location.href = `${currentUrl}?Mode=Edit`;
      }
    });
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            },
            {
              groupName: 'Custom Styling',
              groupFields: [
                PropertyPaneTextField('customCSS', {
                  label: 'Custom CSS',
                  description: 'Add custom CSS to hide SharePoint chrome (header, nav, etc.). CSS only applies in view mode. To return to edit mode: Press Ctrl+Shift+E or add ?Mode=Edit to the URL. Safe to use!',
                  multiline: true,
                  rows: 10,
                  resizable: true,
                  placeholder: '/* Example CSS to hide SharePoint header */\n#suiteBarWrapper { display: none !important; }\n#sp-appBar { display: none !important; }'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
