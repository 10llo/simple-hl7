var assert     = require("assert")
var component  = require('../lib/hl7/component.js');
var field      = require('../lib/hl7/field.js');
var fs         = require('fs');
var header     = require('../lib/hl7/header.js');
var message    = require('../lib/hl7/message.js');
var Parser     = require('../lib/hl7/parser.js');
var segment    = require('../lib/hl7/segment.js');

var deliminters = {
  subcomponentSeperator: "&",
  repititionCharacter: "~",
  componentSeperator: "^",
  fieldSeperator: "|"
}
var parser = new Parser();

describe('Component', function() {
  describe('.toString()', function() {
    it('should return hl7 with proper structure for various formats', function() {

      var singleComponent = new component("Single Component");
      var componentWithSubcomponents = new component(["First Component", "Second Component"]);
      var repeatingComponent = new component("First Repeat", "Second Repeat");
      var repeatingComponentWithSubComponents = new component(
          ["First Component", "Second Component"],
          ["First Repeat", "Second Repeat"]
      );

      assert.equal(singleComponent.toString(deliminters), "Single Component");
      assert.equal(componentWithSubcomponents.toString(deliminters), "First Component&Second Component");
      assert.equal(repeatingComponent.toString(deliminters), "First Repeat~Second Repeat");
      assert.equal(repeatingComponentWithSubComponents.toString(deliminters), "First Component&Second Component~First Repeat&Second Repeat");
    });
  });
});

describe("Field", function() {
  describe(".toString()", function() {
    it('should return hl7 with proper structure for various formats', function() {
      var singleValueField = new field("Field Value");
      var repeatingSingleValueField = new field("Field Value", "Repeat Field Value");
      var fieldWithComponents = new field(["Component 1", "Component 2"]);
      var fieldWithComponentsWithSubcomponents = new field([
        "Component 1",
        ["Component 2 Subcomponent 1", "Component 2 Subcomponent 2"],
        "Component 3"
      ]);

      assert.equal(singleValueField.toString(deliminters), "Field Value");
      assert.equal(repeatingSingleValueField.toString(deliminters), "Field Value~Repeat Field Value");
      assert.equal(fieldWithComponents.toString(deliminters), "Component 1^Component 2");
      assert.equal(fieldWithComponentsWithSubcomponents.toString(deliminters), "Component 1^Component 2 Subcomponent 1&Component 2 Subcomponent 2^Component 3");

    })
  });
});

describe("Segment", function() {
  describe(".toString()", function() {
    it('should return hl7 with proper structure for various formats', function() {
      var segmentWithSingleValueFields = new segment("NME", "Field 1", "Field 2", "Field 3");
      var segmentWithComponentValueFields = new segment("NME", ["Component 1", "Component 2"], "Field 3");

      assert.equal(segmentWithSingleValueFields.toString(deliminters), "NME|Field 1|Field 2|Field 3");
      assert.equal(segmentWithComponentValueFields.toString(deliminters), "NME|Component 1^Component 2|Field 3");
    });
  });
  describe(".addField()", function() {
    it('should add a field, check using toString()', function() {
      var segmentWithNoFields = new segment("NME");
      segmentWithNoFields.addField("Field Value");

      assert.equal(segmentWithNoFields.toString(deliminters), "NME|Field Value");

      segmentWithNoFields.addField(["Component 1", "Component 2"]);

      assert.equal(segmentWithNoFields.toString(deliminters), "NME|Field Value|Component 1^Component 2");

      segmentWithNoFields.addField("Field Value");

      assert.equal(segmentWithNoFields.toString(deliminters), "NME|Field Value|Component 1^Component 2|Field Value");
    });
  });
  describe(".editField()", function() {
    it('should swap a field at certain index, check using toString()', function() {
      var simpleSegment = new segment("NME", "Field 1", "Field 2", "Field 3");

      assert.equal(simpleSegment.toString(deliminters), "NME|Field 1|Field 2|Field 3");

      simpleSegment.editField(2, ["Component 1", "Component 2"]);

      assert.equal(simpleSegment.toString(deliminters), "NME|Field 1|Component 1^Component 2|Field 3");
    });
  });
  describe(".removeField()", function() {
    it('should remove a field, not sure why you would do this, check using toString()', function() {
      var simpleSegment = new segment("NME", "Field 1", "Field 2", "Field 3");

      assert.equal(simpleSegment.toString(deliminters), "NME|Field 1|Field 2|Field 3");

      simpleSegment.removeField(2);

      assert.equal(simpleSegment.toString(deliminters), "NME|Field 1|Field 3");
    });
  });
});

describe("Header", function() {
  describe(".toString()", function() {
    it('same as segment, but with some special sauce', function() {
      var defaultHeader = new header();

      assert.equal(defaultHeader.toString(deliminters), "MSH|^~\\&|");

      var headerWithFields = new header("Field 1", "Field 2", ["Component 1", "Component 2"]);

      assert.equal(headerWithFields.toString(deliminters), "MSH|^~\\&|Field 1|Field 2|Component 1^Component 2");
    });
  });
  describe(".addField()", function() {
    it('should add a field, check using toString()', function() {
      var segmentWithNoFields = new header();
      segmentWithNoFields.addField("Field Value");

      assert.equal(segmentWithNoFields.toString(deliminters), "MSH|^~\\&|Field Value");

      segmentWithNoFields.addField(["Component 1", "Component 2"]);

      assert.equal(segmentWithNoFields.toString(deliminters), "MSH|^~\\&|Field Value|Component 1^Component 2");

      segmentWithNoFields.addField("Field Value");

      assert.equal(segmentWithNoFields.toString(deliminters), "MSH|^~\\&|Field Value|Component 1^Component 2|Field Value");
    });
  });
  describe(".editField()", function() {
    it('should swap a field at certain index, check using toString()', function() {
      var simpleSegment = new header("Field 1", "Field 2", "Field 3");

      assert.equal(simpleSegment.toString(deliminters), "MSH|^~\\&|Field 1|Field 2|Field 3");

      simpleSegment.editField(2, ["Component 1", "Component 2"]);

      assert.equal(simpleSegment.toString(deliminters), "MSH|^~\\&|Field 1|Component 1^Component 2|Field 3");
    });
  });
  describe(".removeField()", function() {
    it('should remove a field, not sure why you would do this, check using toString()', function() {
      var simpleSegment = new header("Field 1", "Field 2", "Field 3");

      assert.equal(simpleSegment.toString(deliminters), "MSH|^~\\&|Field 1|Field 2|Field 3");

      simpleSegment.removeField(2);

      assert.equal(simpleSegment.toString(deliminters), "MSH|^~\\&|Field 1|Field 3");
    });
  });
});

describe("Message", function() {
  describe(".toString()", function() {
    it('should print out structured hl7 message', function() {
      var emptyMessageWithSomeHeader = new message("Header Field 1", "Header Field 2");

      assert.equal(emptyMessageWithSomeHeader.toString(deliminters), "MSH|^~\\&|Header Field 1|Header Field 2");
    });
  });
  describe(".addSegment()", function() {
    it('should add segment with different syntaxes, check with toString()', function() {
      var emptyMessageWithSomeHeader = new message("Header Field 1", "Header Field 2");
      emptyMessageWithSomeHeader.addSegment("NME", "Field 1", "Field 2");

      assert.equal(emptyMessageWithSomeHeader.toString(deliminters), "MSH|^~\\&|Header Field 1|Header Field 2\rNME|Field 1|Field 2");

      emptyMessageWithSomeHeader.addSegment("NME", "Field 1", ["Component 1", "Component 2"]);

      assert.equal(emptyMessageWithSomeHeader.toString(deliminters),
      "MSH|^~\\&|Header Field 1|Header Field 2\rNME|Field 1|Field 2\rNME|Field 1|Component 1^Component 2");
    });
  });
  describe(".getSegment()", function() {
    it('should get a segment for modification and you can change it with segment API, check with toString()', function() {
      var emptyMessageWithSomeHeader = new message("Header Field 1", "Header Field 2");
      emptyMessageWithSomeHeader.addSegment("NME", "Field 1", "Field 2");

      var segmentFromMessage = emptyMessageWithSomeHeader.getSegment("NME");

      assert.equal(segmentFromMessage.toString(deliminters), "NME|Field 1|Field 2");

      segmentFromMessage.editField(1, ["Component 1", "Component 2"]);

      assert.equal(segmentFromMessage.toString(deliminters), "NME|Component 1^Component 2|Field 2");
      assert.equal(emptyMessageWithSomeHeader.toString(deliminters), "MSH|^~\\&|Header Field 1|Header Field 2\rNME|Component 1^Component 2|Field 2");

    });
  });
});

describe("Parser", function() {
  describe("Parse sample documents. Success = output same as input", function() {
    var samples = fs.readdirSync('test/samples')

    for (var i = 0; i < samples.length - 1; i++) {
      it('should successfully process this sample ' + samples[i], function() {
        var sampleText = fs.readFileSync('test/samples/' + samples[i]).toString();
        var sampleParsed = parser.parse(sampleText);
        assert.equal(sampleParsed.toString(), sampleText);
      });
    }
  });
});
