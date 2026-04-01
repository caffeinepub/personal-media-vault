import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Option "mo:core/Option";
import Order "mo:core/Order";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // COMPONENTS
  
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Blob storage
  include MixinStorage();

  // Custom Data & Functions

  // Media types
  type FileId = Text;
  type FolderId = Text;
  type Timestamp = Int;

  type MediaFile = {
    id : FileId;
    name : Text;
    size : Nat;
    mimeType : Text;
    folderId : ?FolderId;
    tags : [Text];
    isPublic : Bool;
    blob : Storage.ExternalBlob;
    createdAt : Timestamp;
    description : ?Text;
  };

  type MediaFolder = {
    id : FolderId;
    name : Text;
    parentId : ?FolderId;
    createdAt : Timestamp;
  };

  module File {
    public func compare(file1 : MediaFile, file2 : MediaFile) : Order.Order {
      Text.compare(file1.name, file2.name);
    };
  };

  stable var files = Map.empty<FileId, MediaFile>();
  stable var folders = Map.empty<FolderId, MediaFolder>();

  // Hardcoded recovery token for admin access.
  // To regain admin access, sign in with Internet Identity and call this with the token below.
  let ADMIN_RECOVERY_TOKEN : Text = "vault-admin-2026";

  public shared ({ caller }) func forceClaimAdmin(secret : Text) : async Bool {
    if (caller.isAnonymous()) { return false };
    if (secret == ADMIN_RECOVERY_TOKEN) {
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      return true;
    } else {
      return false;
    };
  };

  // Component Features

  // File Operations

  public shared ({ caller }) func createFileRecord(id : FileId, name : Text, size : Nat, mimeType : Text, folderId : ?FolderId, tags : [Text], blob : Storage.ExternalBlob, description : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create files");
    };
    let file : MediaFile = {
      id;
      name;
      size;
      mimeType;
      folderId;
      tags;
      isPublic = false;
      blob;
      createdAt = Time.now();
      description;
    };
    files.add(id, file);
  };

  public shared ({ caller }) func deleteFile(id : FileId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete files");
    };
    switch (files.get(id)) {
      case null { Runtime.trap("File does not exist") };
      case (?_) { files.remove(id) };
    };
  };

  public shared ({ caller }) func renameFile(id : FileId, newName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can rename files");
    };
    let file = switch (files.get(id)) {
      case (?f) { f };
      case null { Runtime.trap("File does not exist") };
    };
    let updatedFile = { file with name = newName };
    files.add(id, updatedFile);
  };

  public shared ({ caller }) func moveFileToFolder(fileId : FileId, folderId : ?FolderId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can move files");
    };
    let file = switch (files.get(fileId)) {
      case (?f) { f };
      case null { Runtime.trap("File does not exist") };
    };
    let updatedFile = { file with folderId };
    files.add(fileId, updatedFile);
  };

  public shared ({ caller }) func updateFileTags(id : FileId, newTags : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update file tags");
    };
    let file = switch (files.get(id)) {
      case (?f) { f };
      case null { Runtime.trap("File does not exist") };
    };
    let updatedFile = { file with tags = newTags };
    files.add(id, updatedFile);
  };

  public shared ({ caller }) func toggleFilePublic(id : FileId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can toggle file visibility");
    };
    let file = switch (files.get(id)) {
      case (?f) { f };
      case null { Runtime.trap("File does not exist") };
    };
    let updatedFile = { file with isPublic = not file.isPublic };
    files.add(id, updatedFile);
  };

  // Folder Operations

  public shared ({ caller }) func createFolder(id : Text, name : Text, parentId : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create folders");
    };

    let folder : MediaFolder = {
      id;
      name;
      parentId;
      createdAt = Time.now();
    };
    folders.add(id, folder);
  };

  public shared ({ caller }) func renameFolder(id : Text, newName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can rename folders");
    };
    let folder = switch (folders.get(id)) {
      case (?f) { f };
      case null { Runtime.trap("Folder does not exist") };
    };
    let updatedFolder = { folder with name = newName };
    folders.add(id, updatedFolder);
  };

  public shared ({ caller }) func deleteFolder(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete folders");
    };

    if (not folders.containsKey(id)) {
      Runtime.trap("Folder does not exist");
    };

    folders.remove(id);

    let filesToUpdate = List.empty<(FileId, MediaFile)>();

    for ((fileId, file) in files.entries()) {
      switch (file.folderId) {
        case (?folderId) {
          if (folderId == id) {
            filesToUpdate.add((fileId, { file with folderId = null }));
          };
        };
        case (_) {};
      };
    };

    for ((fileId, updatedFile) in filesToUpdate.values()) {
      files.add(fileId, updatedFile);
    };
  };

  // PUBLIC QUERIES

  // Public read: get file by id for public share pages
  // Returns file only if it's public OR caller is admin
  public query ({ caller }) func getFileById(id : FileId) : async ?MediaFile {
    switch (files.get(id)) {
      case (?file) {
        if (file.isPublic or AccessControl.isAdmin(accessControlState, caller)) {
          ?file;
        } else {
          null;
        };
      };
      case (null) { null };
    };
  };

  // Admin-only read operations
  public query ({ caller }) func getFolderById(id : Text) : async ?MediaFolder {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view folders");
    };
    folders.get(id);
  };

  public query ({ caller }) func listAllFiles() : async [MediaFile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all files");
    };
    files.values().toArray().sort();
  };

  public query ({ caller }) func getFilesByFolder(folderId : Text) : async [MediaFile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can filter files by folder");
    };
    files.values().toArray().filter(func(file) { switch (file.folderId) {
      case (?fId) { fId == folderId };
      case (_) { false };
    } });
  };

  public query ({ caller }) func getFilesByMimeType(mimeTypePrefix : Text) : async [MediaFile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can filter files by mime type");
    };
    files.values().toArray().filter(func(file) { file.mimeType.startsWith(#text(mimeTypePrefix)) });
  };

  public query ({ caller }) func searchFilesByTag(tag : Text) : async [MediaFile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can search files by tag");
    };
    files.values().toArray().filter(func(file) { file.tags.find(func(t) { t == tag }) != null });
  };

  // Public read: anyone can see public files
  public query ({ caller }) func getPublicFiles() : async [MediaFile] {
    files.values().toArray().filter(func(file) { file.isPublic });
  };

  public query ({ caller }) func listAllFolders() : async [MediaFolder] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all folders");
    };
    folders.values().toArray();
  };
};
