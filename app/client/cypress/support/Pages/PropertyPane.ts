import { ObjectsRegistry } from "../Objects/Registry";

type filedTypeValues =
  | "Array"
  | "Checkbox"
  | "Currency Input"
  | "Datepicker"
  | "Email Input"
  | "Multiselect"
  | "Multiline Text Input"
  | "Number Input"
  | "Object"
  | "Password Input"
  | "Phone Number Input"
  | "Radio Group"
  | "Select"
  | "Switch"
  | "Text Input";

export class PropertyPane {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locator = ObjectsRegistry.CommonLocators;

  _fieldConfig = (fieldName: string) =>
    "//input[@placeholder='Field label'][@value='" +
    fieldName +
    "']/ancestor::div/following-sibling::div/div[contains(@class, 't--edit-column-btn')]";
  private _goBackToProperty = "button.t--property-pane-back-btn";
  private _copyWidget = "button.t--copy-widget";
  _deleteWidget = "button.t--delete-widget";
  private _changeThemeBtn = ".t--change-theme-btn";
  private _contentTabBtn = "li:contains('CONTENT')";
  private _styleTabBtn = "li:contains('STYLE')";
  private _themeCard = (themeName: string) =>
    "//h3[text()='" +
    themeName +
    "']//ancestor::div[@class= 'space-y-1 group']";
  private _jsonFieldConfigList =
    "//div[contains(@class, 't--property-control-fieldconfiguration group')]//div[contains(@class, 'content')]/div//input";
  private _tableEditColumnButton = ".t--edit-column-btn";
  private _tableColumnSettings = (column: string) =>
    `[data-rbd-draggable-id='${column}'] ${this._tableEditColumnButton}`;
  private _sectionCollapse = (section: string) =>
    `.t--property-pane-section-collapse-${section}`;
  private _sectionCollapseWithTag = (section: string, tab: string) =>
    `.t--property-pane-section-collapse-${section} .t--property-section-tag-${tab}`;
  private _propertyControl = (property: string) =>
    `.t--property-control-${property}`;
  _propertyPaneSearchInputWrapper = ".t--property-pane-search-input-wrapper";
  _propertyPaneSearchInput = `${this._propertyPaneSearchInputWrapper} input`;
  _propertyPaneEmptySearchResult = ".t--property-pane-no-search-results";
  _propertyToggle = (controlToToggle: string) =>
    ".t--property-control-" +
    controlToToggle.replace(/ +/g, "").toLowerCase() +
    " input[type='checkbox']";
  _colorPickerV2Popover = ".t--colorpicker-v2-popover";
  _colorPickerV2Color = ".t--colorpicker-v2-color";
  _colorRing = ".border-2";
  _colorInput = (option: string) =>
    "//h3[text()='" + option + " Color']//parent::div//input";
  _colorInputField = (option: string) =>
    "//h3[text()='" + option + " Color']//parent::div";

  private isMac = Cypress.platform === "darwin";
  private selectAllJSObjectContentShortcut = `${
    this.isMac ? "{cmd}{a}" : "{ctrl}{a}"
  }`;

  public OpenJsonFormFieldSettings(fieldName: string) {
    this.agHelper.GetNClick(this._fieldConfig(fieldName));
  }

  public ChangeJsonFormFieldType(
    fieldName: string,
    newDataType: filedTypeValues,
  ) {
    // this.agHelper.GetElementLength(this._copyWidget).then(($len) => {
    //   if ($len == 0) {
    //     this.NavigateBackToPropertyPane();
    //   }
    // });
    this.OpenJsonFormFieldSettings(fieldName);
    this.agHelper.SelectDropdownList("Field Type", newDataType);
    this.agHelper.AssertAutoSave();
    this.agHelper.ValidateNetworkStatus("@updateLayout");
  }

  public NavigateBackToPropertyPane() {
    this.agHelper.GetNClick(this._goBackToProperty);
    this.agHelper.AssertElementVisible(this._copyWidget);
    //this.agHelper.AssertElementVisible(this._deleteWidget); //extra valisation, hence commenting!
  }

  public ChangeTheme(newTheme: string) {
    this.agHelper.GetNClick(this._changeThemeBtn, 0, true);
    this.agHelper.GetNClick(this._themeCard(newTheme));
    this.agHelper.AssertContains("Theme " + newTheme + " Applied");
  }

  public ChangeThemeColor(
    colorIndex: number | string,
    type: "Primary" | "Background" = "Primary",
  ) {
    const typeIndex = type == "Primary" ? 0 : 1;
    this.agHelper.GetNClick(this._colorRing, typeIndex);
    if (typeof colorIndex == "number") {
      this.agHelper.GetNClick(this._colorPickerV2Popover);
      this.agHelper.GetNClick(this._colorPickerV2Color, colorIndex);
    } else {
      this.agHelper
        .GetElement(this._colorInput(type))
        .clear()
        .wait(200);
      this.agHelper.TypeText(this._colorInput(type), colorIndex);
      this.agHelper
        .GetElement(this._colorInput(type))
        .clear()
        .wait(200);
      this.agHelper.TypeText(this._colorInput(type), colorIndex);
      //this.agHelper.UpdateInput(this._colorInputField(type), colorIndex);//not working!
    }
  }

  public GetJSONFormConfigurationFileds() {
    const fieldNames: string[] = [];
    let fieldInvokeValue: string;
    cy.xpath(this._jsonFieldConfigList).each(function($item) {
      cy.wrap($item)
        .invoke("val")
        .then(($fieldName: any) => {
          fieldInvokeValue = $fieldName;
          fieldNames.push(fieldInvokeValue as string);
        });
    });
    cy.wrap(fieldNames).as("fieldNames");
  }

  public UpdateJSONFormWithPlaceholders() {
    let field: string, placeHolderText: string;
    this.GetJSONFormConfigurationFileds();
    cy.get("@fieldNames").each(($filedName: any) => {
      field = $filedName;
      this.agHelper.GetNClick(this._fieldConfig(field as string));
      this.agHelper.Sleep(200);
      this.RemoveText("Default Value", false);
      this.agHelper
        .GetText(this.locator._existingActualValueByName("Property Name"))
        .then(($propName) => {
          placeHolderText = "{{sourceData." + $propName + "}}";
          this.UpdatePropertyFieldValue("Placeholder", placeHolderText, false);
        });
      cy.focused().blur();
      //this.RemoveText("Default Value", false);
      //this.UpdatePropertyFieldValue("Default Value", "");
      this.NavigateBackToPropertyPane();
    });
  }

  public ToggleOnOrOff(propertyName: string, toggle: "On" | "Off" = "On") {
    if (toggle == "On") {
      cy.get(this._propertyToggle(propertyName))
        .check({ force: true })
        .should("be.checked");
    } else {
      cy.get(this._propertyToggle(propertyName))
        .uncheck({ force: true })
        .should("not.be.checked");
    }
    this.agHelper.AssertAutoSave();
  }

  public moveToContentTab() {
    cy.get(this._contentTabBtn)
      .first()
      .click({ force: true });
  }

  public moveToStyleTab() {
    cy.get(this._styleTabBtn)
      .first()
      .click({ force: true });
  }

  public SelectPropertiesDropDown(
    endpoint: string,
    dropdownOption: string,
    action: "Action" | "Page" = "Action",
    index = 0,
  ) {
    if (action == "Action")
      this.agHelper.GetNClick(
        this.locator._selectPropDropdown(endpoint),
        index,
      );
    else
      this.agHelper.GetNClick(
        this.locator._selectPropPageDropdown(endpoint),
        index,
      );
    cy.get(this.locator._dropDownValue(dropdownOption)).click();
  }

  public SelectJSFunctionToExecute(
    eventName: string,
    jsName: string,
    funcName: string,
  ) {
    this.SelectPropertiesDropDown(eventName, "Execute a JS function");
    this.agHelper.GetNClick(this.locator._dropDownValue(jsName), 0, true);
    this.agHelper.GetNClick(this.locator._dropDownValue(funcName), 0, true);
    this.agHelper.AssertAutoSave();
  }

  public UpdatePropertyFieldValue(
    propFieldName: string,
    valueToEnter: string,
    toVerifySave = true,
  ) {
    cy.xpath(this.locator._existingFieldTextByName(propFieldName)).then(
      ($field: any) => {
        this.agHelper.UpdateCodeInput($field, valueToEnter);
      },
    );
    toVerifySave && this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
  }

  public ValidatePropertyFieldValue(
    propFieldName: string,
    valueToValidate: string,
  ) {
    cy.xpath(this.locator._existingFieldTextByName(propFieldName)).then(
      ($field: any) => {
        this.agHelper.ValidateCodeEditorContent($field, valueToValidate);
      },
    );
  }

  public RemoveText(endp: string, toVerifySave = true) {
    cy.get(
      this.locator._propertyControl +
        endp.replace(/ +/g, "").toLowerCase() +
        " " +
        this.locator._codeMirrorTextArea,
    )
      .first()
      .scrollIntoView()
      .focus()
      .type(this.selectAllJSObjectContentShortcut)
      .type("{backspace}", { force: true });

    //to select all & delete - method 2:
    // .type("{uparrow}", { force: true })
    // .type("{ctrl}{shift}{downarrow}", { force: true })
    // .type("{del}", { force: true });

    toVerifySave && this.agHelper.AssertAutoSave();
  }

  public TypeTextIntoField(endp: string, value: string) {
    this.RemoveText(endp);
    cy.get(
      this.locator._propertyControl +
        endp.replace(/ +/g, "").toLowerCase() +
        " " +
        this.locator._codeMirrorTextArea,
    )
      .first()
      .then((el: any) => {
        cy.get(el).type(value, {
          parseSpecialCharSequences: false,
          force: true,
        });
      });

    this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
  }

  public ToggleCommentInTextField(endp: string) {
    cy.get(
      this.locator._propertyControl +
        endp.replace(/ +/g, "").toLowerCase() +
        " " +
        this.locator._codeMirrorTextArea,
    )
      .first()
      .then((el: any) => {
        cy.get(el).type(this.agHelper.isMac ? "{meta}/" : "{ctrl}/");
      });

    this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
  }

  public EnterJSContext(
    endp: string,
    value: string,
    toToggleOnJS = true,
    paste = true,
  ) {
    cy.get(this.locator._jsToggle(endp.replace(/ +/g, "").toLowerCase()))
      .invoke("attr", "class")
      .then((classes: any) => {
        if (toToggleOnJS && !classes.includes("is-active"))
          cy.get(this.locator._jsToggle(endp.replace(/ +/g, "").toLowerCase()))
            .first()
            .click({ force: true });
        else if (!toToggleOnJS && classes.includes("is-active"))
          cy.get(this.locator._jsToggle(endp.replace(/ +/g, "").toLowerCase()))
            .first()
            .click({ force: true });
        else this.agHelper.Sleep(500);
      });

    if (paste) this.UpdatePropertyFieldValue(endp, value);
    else this.TypeTextIntoField(endp, value);

    this.agHelper.AssertAutoSave(); //Allowing time for Evaluate value to capture value
  }

  public OpenTableColumnSettings(column: string) {
    this.agHelper.GetNClick(this._tableColumnSettings(column));
  }

  public Search(query: string) {
    cy.get(this._propertyPaneSearchInput)
      .first()
      .then((el: any) => {
        cy.get(el).clear();
        if (query) cy.get(el).type(query, { force: true });
      });
  }

  public ToggleSection(section: string) {
    this.agHelper.GetNClick(this._sectionCollapse(section));
  }

  public AssertSearchInputValue(value: string) {
    this.agHelper.AssertText(this._propertyPaneSearchInput, "val", value);
  }

  // Checks if the property exists in search results
  public AssertIfPropertyOrSectionExists(
    section: string,
    tab: "CONTENT" | "STYLE",
    property?: string,
  ) {
    this.agHelper.AssertElementExist(
      this._sectionCollapseWithTag(section, tab),
    );
    if (property)
      this.agHelper.AssertElementExist(this._propertyControl(property));
  }
}
