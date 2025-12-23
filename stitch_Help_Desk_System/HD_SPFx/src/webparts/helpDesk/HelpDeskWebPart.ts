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
}

export default class HelpDeskWebPart extends BaseClientSideWebPart<IHelpDeskWebPartProps> {

  public render(): void {
    // eslint-disable-next-line react/no-children-prop
    const element: React.ReactElement = React.createElement(
      AppProvider,
      { webPartContext: this.context, children: React.createElement(App, {}) }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return Promise.resolve();
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
            }
          ]
        }
      ]
    };
  }
}
