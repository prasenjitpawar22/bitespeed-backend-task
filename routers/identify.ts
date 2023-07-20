import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createContactShema,
  zParse,
} from "../validations/createContactValidation";
import { getContactShema } from "../validations/getContactValidation";

export const indentify = express.Router();
const prisma = new PrismaClient();

/**
 * POST /identify
 *
 * Retrieves contact information by email? or number?
 *
 * @body {email?, phoneNumber?}.
 * @returns {Object} contact: "primaryContatctId": number,
			"emails": string[], // first element being email of primary contact 
			"phoneNumbers": string[], // first element being phoneNumber of primary contact
			"secondaryContactIds": number[] // Array of all Contact IDs that are "secondary" to the primary contact.
 * @respose 200 400 
 * @throws {Error} when DB server error.
 */
indentify.post("/", async (req: Request, res: Response) => {
  //   const contact = await prisma.contact.create;
  const { error, type } = await zParse(getContactShema, req, res);
  if (error) {
    return res.status(400).send(error);
  }
  if (!type) {
    return res.status(400).send(error);
  }

  const { email, phoneNumber } = type.body;

  const contacts = await prisma.contact.findMany({
    where: {
      email,
      phoneNumber,
    },
  });
});

/**
 * POST /identify/create
 *
 * Creates contact by email and number
 *
 * @body {email, phoneNumber}.
 * @returns {Object} contact
 * @respose 200 400
 * @throws {Error} when DB server error.
 */
indentify.post("/upsert", async (req: Request, res: Response) => {
  // get body validation and z zparse
  // return type for req body object
  const { type, error } = await zParse(createContactShema, req, res);

  if (error) {
    return res.status(400).send(error);
  }
  if (!type) {
    return res.status(400).send(error);
  }

  const { email, phoneNumber } = type.body;

  try {
    // upsert condition !!
    // this reqest has same (email and phoneNumber) from (two different exist contacts)
    const foundOne = await prisma.contact.findFirst({
      where: { email, AND: { linkPrecedence: "primary" } },
    });
    const foundTwo = await prisma.contact.findFirst({
      where: { phoneNumber, AND: { linkPrecedence: "primary" } },
    });

    console.log("twoDiffContacts: ", foundOne, foundTwo);
    if (foundOne && foundTwo && foundOne?.id !== foundTwo?.id) {
      // oldest contact remain as primary
      if (foundOne.createdAt < foundTwo.createdAt) {
        console.log("if 1");
        const data = await prisma.contact.update({
          where: { id: foundTwo.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: foundOne.id,
          },
        });
        return res.status(200).send(data);
      } else {
        console.log("else 1");
        const data = await prisma.contact.update({
          where: { id: foundOne.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: foundTwo.id,
          },
        });
        return res.status(200).send(data);
      }
    }

    // console.log("out of hell");

    // normal create/insert contact condition
    const foundContact = await prisma.contact.findFirst({
      where: { OR: [{ email }, { phoneNumber }, { email, phoneNumber }] },
    });

    if (foundContact) {
      // create one with secondary linkPrecedence
      const data = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId:
            foundContact.linkPrecedence === "primary"
              ? foundContact.id
              : foundContact.linkedId, //??? check here it can be from secondary
          linkPrecedence: "secondary",
        },
      });
      return res.status(200).send(data);
    }

    // else create a new one
    const data = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
      },
    });
    return res.status(200).send(data);
  } catch (e) {
    console.log(e);
    res.status(400).send(JSON.stringify(error));
  }
});
