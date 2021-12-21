const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");

let datasourceName;

describe("Postgres datasource test cases", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create, test, save then delete a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillPostgresDatasourceForm();
    cy.wait("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.testSaveDatasource();
  });

  it("Create with trailing white spaces in host address and database name, test, save then delete a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillPostgresDatasourceForm(true);
    cy.wait("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.testSaveDatasource();
  });

  it("Create a new query from the datasource editor", function() {
    cy.saveDatasource();
    // cy.get(datasource.createQuerty).click();
    cy.get(`${datasourceEditor.datasourceCard} ${datasource.createQuerty}`)
      .last()
      .click();
    cy.wait("@createNewApi").should((interception) => {
      expect(interception.response.body.responseMeta.status).to.deep.eq(201);
    });

    cy.get(queryEditor.queryMoreAction).click();
    cy.get(queryEditor.deleteUsingContext).click();
    cy.wait("@deleteAction").should((interception) => {
      expect(interception.response.body.responseMeta.status).to.deep.eq(200);
    });

    cy.deleteDatasource(datasourceName);
  });
});
