// Client-safe component map for App Router

import { BYOCClientWrapper, NextjsContentSdkComponent, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

import * as Title from 'src/components/title/Title';
import * as PageContent from 'src/components/page-content/PageContent';
import * as Navigation from 'src/components/navigation/Navigation';
import * as PersonalLoan from 'src/components/Journey/PersonalLoan';
import * as PersonalDetail from 'src/components/Journey/PersonalDetail';
import * as IncomeValuation from 'src/components/Journey/IncomeValuation';
import * as IncomeDetail from 'src/components/Journey/IncomeDetail';
import * as HomeLoan from 'src/components/Journey/HomeLoan';
import * as EmploymentDetail from 'src/components/Journey/EmploymentDetail';
import * as CreditCard from 'src/components/Journey/CreditCard';
import * as Image from 'src/components/image/Image';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['Title', { ...Title }],
  ['PageContent', { ...PageContent }],
  ['Navigation', { ...Navigation }],
  ['PersonalLoan', { ...PersonalLoan }],
  ['PersonalDetail', { ...PersonalDetail }],
  ['IncomeValuation', { ...IncomeValuation }],
  ['IncomeDetail', { ...IncomeDetail }],
  ['HomeLoan', { ...HomeLoan }],
  ['EmploymentDetail', { ...EmploymentDetail }],
  ['CreditCard', { ...CreditCard }],
  ['Image', { ...Image }],
]);

export default componentMap;
