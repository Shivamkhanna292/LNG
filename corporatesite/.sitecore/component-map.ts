// Below are built-in components that are available in the app, it's recommended to keep them as is

import { BYOCServerWrapper, NextjsContentSdkComponent, FEaaSServerWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in components
import * as Title from 'src/components/title/Title';
import * as RowSplitter from 'src/components/row-splitter/RowSplitter';
import * as RichText from 'src/components/rich-text/RichText';
import * as Promo from 'src/components/promo/Promo';
import * as PartialDesignDynamicPlaceholder from 'src/components/partial-design-dynamic-placeholder/PartialDesignDynamicPlaceholder';
import * as PageContent from 'src/components/page-content/PageContent';
import * as Navigation from 'src/components/navigation/Navigation';
import * as LinkList from 'src/components/link-list/LinkList';
import * as PersonalLoan from 'src/components/Journey/PersonalLoan';
import * as PersonalDetail from 'src/components/Journey/PersonalDetail';
import * as IncomeValuation from 'src/components/Journey/IncomeValuation';
import * as IncomeDetail from 'src/components/Journey/IncomeDetail';
import * as HomeLoan from 'src/components/Journey/HomeLoan';
import * as EmploymentDetail from 'src/components/Journey/EmploymentDetail';
import * as CreditCard from 'src/components/Journey/CreditCard';
import * as Image from 'src/components/image/Image';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as Container from 'src/components/container/Container';
import * as ColumnSplitter from 'src/components/column-splitter/ColumnSplitter';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', Form],
  ['Title', { ...Title, componentType: 'client' }],
  ['RowSplitter', { ...RowSplitter }],
  ['RichText', { ...RichText }],
  ['Promo', { ...Promo }],
  ['PartialDesignDynamicPlaceholder', { ...PartialDesignDynamicPlaceholder }],
  ['PageContent', { ...PageContent, componentType: 'client' }],
  ['Navigation', { ...Navigation, componentType: 'client' }],
  ['LinkList', { ...LinkList }],
  ['PersonalLoan', { ...PersonalLoan, componentType: 'client' }],
  ['PersonalDetail', { ...PersonalDetail, componentType: 'client' }],
  ['IncomeValuation', { ...IncomeValuation, componentType: 'client' }],
  ['IncomeDetail', { ...IncomeDetail, componentType: 'client' }],
  ['HomeLoan', { ...HomeLoan, componentType: 'client' }],
  ['EmploymentDetail', { ...EmploymentDetail, componentType: 'client' }],
  ['CreditCard', { ...CreditCard, componentType: 'client' }],
  ['Image', { ...Image, componentType: 'client' }],
  ['ContentBlock', { ...ContentBlock }],
  ['Container', { ...Container }],
  ['ColumnSplitter', { ...ColumnSplitter }],
]);

export default componentMap;
