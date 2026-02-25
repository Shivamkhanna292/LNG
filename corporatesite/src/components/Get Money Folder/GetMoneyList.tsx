"use client";

import {
    JSX,
    useState
} from "react";
import { Field, ImageField, LinkField, Text, NextImage as ContentSdkImage, Link as ContentSdkLink, } from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import './GetMoneyList.css';

type GetMoneyProps = ComponentProps & {
    fields: {
        Heading: Field<string>;
        SubHeading: Field<string>;
        Paragraph: Field<string>;
        LinkText: Field<string>;
        Image: ImageField;
        Link: LinkField;
        ShowPopup: Field<boolean>;
        SelectPopup: Field<string>;
        LoanAmountHeading: Field<string>;
        LoanAmount: Field<string>;
        LoanTermHeading: Field<string>;
        LoanTerm: Field<string>;
        LoanInterestHeading: Field<string>;
        LoanInterest: Field<string>;
        FooterText: Field<string>;
        ButtonLink: LinkField;
        Title: Field<string>;
        Description: Field<string>;
    };
};

type GetMoneyListProps = ComponentProps & {
    fields: {
        Heading: Field<string>;
        'Get Money List'?: GetMoneyProps[];
    };
};

const GetMoneyList = (props: GetMoneyListProps): JSX.Element => {
    const moneyList = props.fields?.['Get Money List'] || [];
    const [showPopup, setShowPopup] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GetMoneyProps | null>(null);

    const handlePopupOpen = (item: GetMoneyProps) => {
        setSelectedItem(item);
        setShowPopup(true);
    };

    const handlePopupClose = () => {
        setShowPopup(false);
        setSelectedItem(null);
    };

    return (
        <>
            <div className="jm-app">
                <div className="jm-container">
                    <div className="jm-header">
                        <h1 className="jm-title"><Text field={props.fields.Heading} /></h1>
                        <button className="jm-toggle-btn jm-expanded" id="toggleBtn" aria-label="Toggle list">
                            ▲
                        </button>
                    </div>

                    {/* Cards Grid */}
                    <div className="jm-cards-grid" id="cardsGrid">
                        {/* Card 1: Sanlam */}
                        {moneyList.map((item, index) => (
                            <div className="jm-card" key={index}>
                                <div className="jm-card-left">
                                    <ContentSdkImage field={item.fields.Image} className="jm-logo" />
                                </div>
                                <div className="jm-card-right">
                                    <div className="jm-card-header">
                                        <h3 className="jm-card-title">
                                            <Text field={item.fields.Heading} />
                                        </h3>
                                        <span className="jm-badge jm-badge-success">
                                            <Text field={item.fields.SubHeading} />
                                        </span>
                                    </div>
                                    <div className="jm-card-body">
                                        <p className="jm-description">
                                            <Text field={item.fields.Paragraph} />
                                        </p>
                                    </div>
                                    {item.fields.ShowPopup?.value && (
                                        <div className="jm-card-footer">
                                            <button className="jm-btn jm-btn-primary" onClick={() => handlePopupOpen(item)}>
                                                <Text field={item.fields.LinkText} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="jm-card-footer">
                                        <ContentSdkLink field={item.fields.Link} className="jm-btn jm-btn-primary">
                                            <Text field={item.fields.LinkText} />
                                        </ContentSdkLink>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {showPopup && selectedItem && selectedItem.fields.SelectPopup?.value === 'Sanlam' && (
                <div className="jm-modal-overlay" id="getOfferModal">
                    <div className="jm-modal jm-modal-offer">
                        <div className="jm-modal-header jm-modal-header-logo">
                            <div className="jm-modal-logo-container">
                                <ContentSdkImage field={selectedItem.fields.Image} className="jm-modal-logo" />
                            </div>
                            <button
                                className="jm-modal-close"
                                onClick={handlePopupClose}
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>
                        <div className="jm-modal-body jm-modal-body-offer">
                            <div className="jm-offer-section">
                                <h3 className="jm-offer-title">
                                    <Text field={selectedItem.fields.LoanAmountHeading} />
                                </h3>
                                <p className="jm-offer-value">
                                    <Text field={selectedItem.fields.LoanAmount} />
                                </p>
                            </div>

                            <div className="jm-offer-section">
                                <h3 className="jm-offer-title">
                                    <Text field={selectedItem.fields.LoanTermHeading} />
                                </h3>
                                <p className="jm-offer-value">
                                    <Text field={selectedItem.fields.LoanTerm} />
                                </p>
                            </div>

                            <div className="jm-offer-section">
                                <h3 className="jm-offer-title">
                                    <Text field={selectedItem.fields.LoanInterestHeading} />
                                </h3>
                                <p className="jm-offer-value">
                                    <Text field={selectedItem.fields.LoanInterest} />
                                </p>
                            </div>

                            <div className="jm-offer-button-container">
                                <ContentSdkLink field={selectedItem.fields.ButtonLink} className="jm-btn jm-btn-primary jm-btn-go">
                                    {selectedItem.fields.ButtonLink.value?.text}
                                </ContentSdkLink>
                            </div>

                            <div className="jm-offer-disclaimer">
                                <p>
                                    <Text field={selectedItem.fields.FooterText} />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Call Me Modal */}
            {showPopup && selectedItem && selectedItem.fields.SelectPopup?.value === 'CallMe' && (

                <div className="jm-modal-overlay" id="callMeModal">
                    <div className="jm-modal jm-modal-callback">
                        <div className="jm-modal-header">
                            <h2 className="jm-modal-title">
                                <Text field={selectedItem.fields.Title} />
                            </h2>
                            <button
                                className="jm-modal-close"
                                onClick={handlePopupClose}
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>
                        <div className="jm-modal-body jm-modal-body-callback">
                            <div className="jm-callback-message">
                                <p>
                                    <Text field={selectedItem.fields.Description} />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
export default GetMoneyList;
