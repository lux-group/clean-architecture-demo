import { Request, Response } from "express"
import { Controller, Post } from "~/app/routing"
import { User } from "~/domain/entities"

// This controller demonstrates how we can make API endpoints available for an IDP
// like Entra ID to call to perform functions like performing additional checks or
// providing user attributes during sign-up or sign-in.

@Controller("/integration/entra")
export class EntraExtensionController {
  /**
   * Called before sign-up to set default attribute values or block sign-up.
   * https://learn.microsoft.com/en-us/entra/identity-platform/custom-extension-onattributecollectionstart-retrieve-return-data
   */
  @Post("/attribute-collection-start")
  async onAttributeCollectionStart(_req: Request, res: Response) {
    const response = {
      data: {
        "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
        actions: [
          {
            "@odata.type": "microsoft.graph.attributeCollectionStart.continueWithDefaultBehavior",
          },
        ],
      },
    }

    res.json(response)
  }

  /**
   * Called after sign-up to validate or modify attribute values or block sign-up.
   * https://learn.microsoft.com/en-us/entra/identity-platform/custom-extension-onattributecollectionsubmit-retrieve-return-data
   *
   * Important notes:
   * - We can only set default values for attributes that are enabled.
   * - Attributes can be hidden from the form but it's only possible via Azure CLI or Graph API.
   * - Email (mail) is never available in the attribute collection.
   *   - For users who create a custom account, we can get it from issuerAssignedId
   *   - For all others, it is not available at all.
   */
  @Post("/attribute-collection-submit")
  async onAttributeCollectionSubmit(req: Request, res: Response) {
    let displayName = this.getUserAttribute(req.body.data, "displayName")
    if (!displayName) {
      const givenName = this.getUserAttribute(req.body.data, "givenName")
      const surname = this.getUserAttribute(req.body.data, "surname")

      displayName =
        givenName && surname ? User.formatFullName(givenName, surname) : this.getIssuerAssignedId(req.body.data)
    }

    const response = {
      data: {
        "@odata.type": "microsoft.graph.onAttributeCollectionSubmitResponseData",
        actions: [
          {
            "@odata.type": "microsoft.graph.attributeCollectionSubmit.modifyAttributeValues",
            attributes: {
              displayName,
            },
          },
        ],
      },
    }

    res.json(response)
  }

  /**
   * Called when a token is issued to enrich it with additional claims.
   */
  @Post("/token-issuance-start")
  async onTokenIssuanceStart(_req: Request, res: Response) {
    res.json({})
  }

  // The client-id can be useful in case we need to lookup the IDP in the database.
  // However, note that there is a two second timeout.
  // private getClientId = (data: any) => data.authenticationContext.clientServicePrincipal.appId

  // Fallback for display name.
  private getIssuerAssignedId = (data: any) => data.userSignUpInfo.identities[0].issuerAssignedId

  // Get an available user attribute. Unfortunately, "mail" is not available.
  private getUserAttribute = (data: any, name: string) => data.userSignUpInfo.attributes[name]?.value
}
